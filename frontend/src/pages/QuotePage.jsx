import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import QuoteBuilderCard from "../components/quote/QuoteBuilderCard";
import PolicyTotalCard from "../components/quote/PolicyTotalCard";
import { useQuoteContext } from "../context/QuoteContext";
import { recalculateQuote, saveQuote, toggleRider } from "../api/quoteBuilderApi";
import {
  getStoredApplicationId,
  getStoredQuoteSelection,
  storeQuoteSelection,
  clearApplicantForm,
  clearQuoteSelection,
  markCameFromBack,
} from "../utils/session";
import "./QuotePage.css";

const RECALCULATE_DEBOUNCE_MS = 300;
const ACCIDENTAL_DEATH_RIDER_NAME = "Accidental Death Benefit";

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

  // quoteData (context) can still hold the PREVIOUS visit's stale value for
  // one render tick after a fresh Page 1 submission navigates here — the
  // setQuoteData(stateQuote) call below doesn't take effect until the next
  // render. Every downstream read in this component must prefer the fresh
  // router-state quote over context so nothing ever hydrates from stale data.
  const stateQuote = location.state?.quote;
  const effectiveQuote = stateQuote || quoteData;

  // Single source of truth for the rest of this page's lifetime: every
  // save/recalculate/rider call below reads this one binding instead of
  // reaching into quoteData.application_id separately each time.
  const applicationId = effectiveQuote?.application_id;

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

  const [riderOn, setRiderOn] = useState(false);
  const [riderMonthly, setRiderMonthly] = useState(0);
  const [riderAnnual, setRiderAnnual] = useState(0);
  const [isTogglingRider, setIsTogglingRider] = useState(false);
  const [riderError, setRiderError] = useState(null);

  const initialCoverageRef = useRef(null);
  const hasHydratedRef = useRef(false);
  // Tracks the most recent in-flight saveQuote() call, so actions that
  // depend on selected_rate_class already being persisted (the rider
  // endpoint) can wait for it instead of racing ahead of it.
  const pendingRateClassSaveRef = useRef(null);

  // Hydrate context from Page 1's router state, or recover via a
  // best-effort recalculate call, or bounce back to Page 1. A fresh
  // router-state quote (a brand-new Page 1 submission) always wins over
  // a stale cached quoteData from a previous visit to this page.
  useEffect(() => {
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
    if (!effectiveQuote || hasHydratedRef.current) return;

    const bounds = {
      min: effectiveQuote.coverage.min,
      max: effectiveQuote.coverage.max,
      step: effectiveQuote.coverage.step,
    };
    const persistedSelection = quoteSelection || getStoredQuoteSelection();

    let initialCoverage = effectiveQuote.coverage.current;
    let initialRateClass = firstEligibleName(effectiveQuote.rate_classes);

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
      if (savedRateClass && effectiveQuote.rate_classes.some((rc) => rc.name === savedRateClass && rc.eligible)) {
        initialRateClass = savedRateClass;
      }
    }

    setCoverageAmount(initialCoverage);
    setCoverageBounds(bounds);
    setRateClasses(effectiveQuote.rate_classes);
    setSelectedRateClass(initialRateClass);
    initialCoverageRef.current = effectiveQuote.coverage.current;
    hasHydratedRef.current = true;

    // The default (or restored) rate class is only ever shown client-side
    // until this point — persist it now so server-side actions that key off
    // the saved quote (like the rider endpoint) work immediately, without
    // requiring the user to first re-click a rate class row. Not awaited
    // (hydration shouldn't block on it), but tracked so anything that
    // depends on it landing first — see handleToggleRider — can wait for it.
    if (initialRateClass) {
      const savePromise = saveQuote({
        applicationId,
        coverageAmount: initialCoverage,
        selectedRateClass: initialRateClass,
      });
      pendingRateClassSaveRef.current = savePromise;
      savePromise.catch((error) => setSaveError(error.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveQuote]);

  // Debounced recalculate whenever the user edits the coverage amount.
  useEffect(() => {
    if (!hasHydratedRef.current || coverageAmount === null) return;
    if (coverageAmount === initialCoverageRef.current) return;

    const validationError = validateCoverageAmount(coverageAmount, coverageBounds);
    setCoverageError(validationError);
    if (validationError) return;

    const timeoutId = setTimeout(() => {
      recalculateQuote({ applicationId, coverageAmount })
        .then((result) => {
          setRateClasses(result.rate_classes);
          initialCoverageRef.current = coverageAmount;

          // The rider endpoint reads coverage_amount from the saved quote
          // rather than the request body, so this must run AFTER the
          // recalculate call above has updated it server-side.
          if (riderOn) {
            toggleRider({
              applicationId,
              riderName: ACCIDENTAL_DEATH_RIDER_NAME,
              enabled: true,
            })
              .then((riderResult) => {
                setRiderMonthly(riderResult.rider_monthly);
                setRiderAnnual(riderResult.rider_annual);
              })
              .catch((error) => setRiderError(error.message));
          }
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

    const savePromise = saveQuote({
      applicationId,
      coverageAmount,
      selectedRateClass: rateClassName,
    });
    pendingRateClassSaveRef.current = savePromise;
    savePromise.catch((error) => setSaveError(error.message));
  }

  async function handleToggleRider() {
    if (isTogglingRider) return;

    const nextEnabled = !riderOn;
    setIsTogglingRider(true);
    setRiderError(null);

    try {
      // Don't race ahead of a still-in-flight rate-class save — the rider
      // endpoint requires selected_rate_class to already be persisted.
      // Swallow any failure here; the rider call below will surface a
      // clear, rider-specific error if the rate class truly never saved.
      if (pendingRateClassSaveRef.current) {
        await pendingRateClassSaveRef.current.catch(() => {});
      }

      const result = await toggleRider({
        applicationId,
        riderName: ACCIDENTAL_DEATH_RIDER_NAME,
        enabled: nextEnabled,
      });
      setRiderOn(nextEnabled);
      setRiderMonthly(result.rider_monthly);
      setRiderAnnual(result.rider_annual);
    } catch (error) {
      setRiderError(error.message);
    } finally {
      setIsTogglingRider(false);
    }
  }

  function handleBack() {
    markCameFromBack();
    navigate("/");
  }

  async function handleNextStep() {
    if (!selectedRateClass || isSavingNext) return;

    setIsSavingNext(true);
    try {
      await saveQuote({
        applicationId,
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
      <Header applicationId={applicationId} applicantSummary={applicantSummary} />

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
              riderOn={riderOn}
              onToggleRider={handleToggleRider}
              isTogglingRider={isTogglingRider}
              riderMonthly={riderMonthly}
              riderAnnual={riderAnnual}
            />

            <PolicyTotalCard
              coverageAmount={coverageAmount}
              selectedRateClassData={selectedRateClassData}
              premiumBasis={premiumBasis}
              onPremiumBasisChange={setPremiumBasis}
              riderOn={riderOn}
              riderMonthly={riderMonthly}
              riderAnnual={riderAnnual}
            />
          </div>

          {saveError && <div className="quote-page__save-error">Unable to save your selection: {saveError}</div>}
          {riderError && <div className="quote-page__save-error">Unable to update the rider: {riderError}</div>}
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
