import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import QuoteBuilderCard from "../components/quote/QuoteBuilderCard";
import PolicyTotalCard from "../components/quote/PolicyTotalCard";
import { useQuoteContext } from "../context/QuoteContext";
import { recalculateQuote, saveQuote } from "../api/quoteBuilderApi";
import {
  getStoredApplicationId,
  getStoredQuoteSelection,
  storeQuoteSelection,
  clearApplicantForm,
  clearQuoteSelection,
} from "../utils/session";
import "./QuotePage.css";

const RECALCULATE_DEBOUNCE_MS = 300;

// Fallback bounds used only when a user lands on /quote directly (e.g. a
// refresh) with no router state and no context yet — see the mount effect
// below. Matches the seeded "L" product coverage_options.
const FALLBACK_COVERAGE_BOUNDS = { min: 5000, max: 50000, step: 1000, default: 35000 };

function firstEligibleName(rateClasses) {
  const found = rateClasses.find((rc) => rc.eligible);
  return found ? found.name : null;
}

function validateCoverageAmount(amount, bounds) {
  if (!bounds) return null;
  if (amount < bounds.min || amount > bounds.max) {
    return `Coverage must be between $${bounds.min.toLocaleString()} and $${bounds.max.toLocaleString()}`;
  }
  if (amount % bounds.step !== 0) {
    return `Coverage must be in increments of $${bounds.step.toLocaleString()}`;
  }
  return null;
}

export default function QuotePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quoteData, setQuoteData, setApplicantForm, quoteSelection, setQuoteSelection } = useQuoteContext();

  const [loadError, setLoadError] = useState(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);

  const [coverageAmount, setCoverageAmount] = useState(null);
  const [coverageBounds, setCoverageBounds] = useState(null);
  const [rateClasses, setRateClasses] = useState([]);
  const [selectedRateClass, setSelectedRateClass] = useState(null);
  const [premiumBasis, setPremiumBasis] = useState("monthly");
  const [coverageError, setCoverageError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isSavingNext, setIsSavingNext] = useState(false);

  const initialCoverageRef = useRef(null);
  const hasHydratedRef = useRef(false);

  // Hydrate context from Page 1's router state, or recover via a
  // best-effort recalculate call, or bounce back to Page 1. A fresh
  // router-state quote (a brand-new Page 1 submission) always wins over
  // a stale cached quoteData from a previous visit to this page.
  useEffect(() => {
    const stateQuote = location.state?.quote;
    if (stateQuote) {
      if (stateQuote !== quoteData) {
        setQuoteData(stateQuote);
      }
      return;
    }

    if (quoteData) return;

    const storedApplicationId = getStoredApplicationId();
    if (!storedApplicationId) {
      navigate("/", { replace: true });
      return;
    }

    setIsLoadingInitial(true);
    recalculateQuote({
      applicationId: storedApplicationId,
      coverageAmount: FALLBACK_COVERAGE_BOUNDS.default,
    })
      .then((result) => {
        setQuoteData({
          application_id: storedApplicationId,
          applicant: null,
          coverage: {
            current: FALLBACK_COVERAGE_BOUNDS.default,
            min: FALLBACK_COVERAGE_BOUNDS.min,
            max: FALLBACK_COVERAGE_BOUNDS.max,
            step: FALLBACK_COVERAGE_BOUNDS.step,
          },
          rate_classes: result.rate_classes,
        });
      })
      .catch((error) => setLoadError(error.message))
      .finally(() => setIsLoadingInitial(false));
  }, [quoteData, location.state, navigate, setQuoteData]);

  // Seed local editable state once, when quoteData first becomes available.
  // Prefer a previously saved coverage/rate-class selection (e.g. the user
  // clicked Back to Page 1, then Next again) over the fresh defaults.
  useEffect(() => {
    if (!quoteData || hasHydratedRef.current) return;

    const bounds = { min: quoteData.coverage.min, max: quoteData.coverage.max, step: quoteData.coverage.step };
    const persistedSelection = quoteSelection || getStoredQuoteSelection();

    let initialCoverage = quoteData.coverage.current;
    let initialRateClass = firstEligibleName(quoteData.rate_classes);

    if (persistedSelection) {
      const { coverageAmount: savedCoverage, selectedRateClass: savedRateClass } = persistedSelection;
      if (
        typeof savedCoverage === "number" &&
        savedCoverage >= bounds.min &&
        savedCoverage <= bounds.max &&
        savedCoverage % bounds.step === 0
      ) {
        initialCoverage = savedCoverage;
      }
      if (savedRateClass && quoteData.rate_classes.some((rc) => rc.name === savedRateClass && rc.eligible)) {
        initialRateClass = savedRateClass;
      }
    }

    setCoverageAmount(initialCoverage);
    setCoverageBounds(bounds);
    setRateClasses(quoteData.rate_classes);
    setSelectedRateClass(initialRateClass);
    initialCoverageRef.current = quoteData.coverage.current;
    hasHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteData]);

  // Debounced recalculate whenever the user edits the coverage amount.
  useEffect(() => {
    if (!hasHydratedRef.current || coverageAmount === null) return;
    if (coverageAmount === initialCoverageRef.current) return;

    const validationError = validateCoverageAmount(coverageAmount, coverageBounds);
    setCoverageError(validationError);
    if (validationError) return;

    const timeoutId = setTimeout(() => {
      recalculateQuote({ applicationId: quoteData.application_id, coverageAmount })
        .then((result) => {
          setRateClasses(result.rate_classes);
          initialCoverageRef.current = coverageAmount;
        })
        .catch((error) => setCoverageError(error.message));
    }, RECALCULATE_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverageAmount]);

  function persistSelection(nextCoverageAmount, nextSelectedRateClass) {
    const selection = { coverageAmount: nextCoverageAmount, selectedRateClass: nextSelectedRateClass };
    setQuoteSelection(selection);
    storeQuoteSelection(selection);
  }

  function handleCoverageAmountChange(amount) {
    setCoverageAmount(amount);
    persistSelection(amount, selectedRateClass);
  }

  function handleSelectRateClass(rateClassName) {
    setSelectedRateClass(rateClassName);
    setSaveError(null);
    persistSelection(coverageAmount, rateClassName);

    saveQuote({
      applicationId: quoteData.application_id,
      coverageAmount,
      selectedRateClass: rateClassName,
    }).catch((error) => setSaveError(error.message));
  }

  function handleBack() {
    navigate("/");
  }

  async function handleNextStep() {
    if (!selectedRateClass || isSavingNext) return;

    setIsSavingNext(true);
    try {
      await saveQuote({
        applicationId: quoteData.application_id,
        coverageAmount,
        selectedRateClass,
      });
      // The quote is finalized — clear the saved draft so a future new
      // session doesn't inherit this applicant's in-progress selections.
      clearApplicantForm();
      clearQuoteSelection();
      setApplicantForm(null);
      setQuoteSelection(null);
      window.alert("Quote saved successfully!");
    } catch (error) {
      window.alert(`Unable to save your quote: ${error.message}`);
    } finally {
      setIsSavingNext(false);
    }
  }

  if (loadError) {
    return (
      <div className="quote-page">
        <Header applicationId={getStoredApplicationId()} />
        <div className="quote-page__error">Unable to load your quote: {loadError}</div>
        <Footer />
      </div>
    );
  }

  if (!quoteData || !hasHydratedRef.current || isLoadingInitial) {
    return (
      <div className="quote-page">
        <Header applicationId={getStoredApplicationId()} />
        <div className="quote-page__loading">Loading your quote…</div>
        <Footer />
      </div>
    );
  }

  const applicant = quoteData.applicant;
  const applicantSummary = applicant
    ? `${applicant.name} / ${applicant.age} / ${applicant.gender.charAt(0).toUpperCase()}`
    : undefined;
  const selectedRateClassData = rateClasses.find((rc) => rc.name === selectedRateClass);

  return (
    <div className="quote-page">
      <Header applicationId={quoteData.application_id} applicantSummary={applicantSummary} />

      <div className="page-content">
        <div className="quote-page__hero">
          <h1 className="quote-page__hero-heading">Quote</h1>
        </div>

        <main className="quote-page__main-card">
          <div className="quote-page__title">
            <h2 className="quote-page__title-text">Your Applicant&apos;s NewBridge Final Expense Insurance Quote</h2>
            <div className="quote-page__title-rule" />
          </div>

          <div className="quote-page__content">
            <QuoteBuilderCard
              coverageAmount={coverageAmount}
              onCoverageAmountChange={handleCoverageAmountChange}
              coverageError={coverageError}
              rateClasses={rateClasses}
              selectedRateClass={selectedRateClass}
              onSelectRateClass={handleSelectRateClass}
              premiumBasis={premiumBasis}
            />

            <PolicyTotalCard
              coverageAmount={coverageAmount}
              selectedRateClassData={selectedRateClassData}
              premiumBasis={premiumBasis}
              onPremiumBasisChange={setPremiumBasis}
            />
          </div>

          {saveError && <div className="quote-page__save-error">Unable to save your selection: {saveError}</div>}
        </main>

        <div className="sticky-nav">
          <hr className="section-separator" />
          <div className="quote-footer-bar">
            <div className="quote-footer-bar__inner">
              <button type="button" className="quote-footer-bar__back" onClick={handleBack}>
                ← Back
              </button>
              <button
                type="button"
                className="quote-footer-bar__next"
                disabled={!selectedRateClass || isSavingNext}
                onClick={handleNextStep}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <hr className="section-separator" />
        <Footer />
      </div>
    </div>
  );
}
