import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import QuoteForm from "../components/QuoteForm";
import Footer from "../components/Footer";
import { startSession, startQuote } from "../api/client";
import { useQuoteContext } from "../context/QuoteContext";
import {
  getStoredApplicationId,
  storeApplicationId,
  getStoredApplicantForm,
  storeApplicantForm,
  clearApplicantForm,
  clearQuoteSelection,
} from "../utils/session";
import { formatDobInput, validateDob } from "../utils/validation";
import { lookupStateFromZip } from "../utils/zipToState";
import "./PreQualifyPage.css";

const DOB_FULL_LENGTH = "MM/DD/YYYY".length;
const ZIP_LENGTH = 5;

export default function PreQualifyPage() {
  const navigate = useNavigate();
  const { applicantForm, setApplicantForm } = useQuoteContext();
  const [applicationId, setApplicationId] = useState(getStoredApplicationId());
  const [sessionError, setSessionError] = useState(null);

  // Only restore previously entered fields when continuing an existing
  // session (e.g. the user clicked Back from Page 2) — a brand-new session
  // should always start with a blank form.
  const restoredForm = applicationId ? applicantForm || getStoredApplicantForm() : null;

  const [firstName, setFirstName] = useState(restoredForm?.firstName ?? "");
  const [lastName, setLastName] = useState(restoredForm?.lastName ?? "");
  const [dob, setDob] = useState(restoredForm?.dob ?? "");
  const [zipCode, setZipCode] = useState(restoredForm?.zipCode ?? "");
  const [gender, setGender] = useState(restoredForm?.gender ?? "");
  const [tobaccoUse, setTobaccoUse] = useState(restoredForm?.tobaccoUse ?? null);

  const [touched, setTouched] = useState({
    dob: false,
    zip: false,
    gender: false,
    tobacco: false,
  });
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (applicationId) return;
    // Starting a genuinely new session — any leftover form/quote data
    // belongs to a previous applicant and must not leak into this one.
    clearApplicantForm();
    clearQuoteSelection();
    setApplicantForm(null);

    let cancelled = false;
    startSession()
      .then((session) => {
        if (cancelled) return;
        storeApplicationId(session.application_id);
        setApplicationId(session.application_id);
      })
      .catch((error) => {
        if (!cancelled) setSessionError(error.message || "Unable to start session");
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, setApplicantForm]);

  function markTouched(field) {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }

  const dobValidationError = validateDob(dob);
  const dobError = touched.dob ? dobValidationError : null;
  const zipIsValid = /^\d{5}$/.test(zipCode);
  const zipError = touched.zip && !zipIsValid ? "Enter a valid 5-digit ZIP code" : null;
  const genderError = touched.gender && gender === "" ? "Gender is required" : null;
  const tobaccoError =
    touched.tobacco && tobaccoUse === null ? "Please select Yes or No" : null;

  const detectedState = zipIsValid ? lookupStateFromZip(zipCode) : null;

  const isFormValid =
    Boolean(applicationId) &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    dobValidationError === null &&
    zipIsValid &&
    gender !== "" &&
    tobaccoUse !== null;

  function handleDobChange(event) {
    const formatted = formatDobInput(event.target.value);
    setDob(formatted);
    // Show the error as soon as the user finishes typing a full date,
    // without waiting for them to blur the field.
    if (formatted.length === DOB_FULL_LENGTH) {
      markTouched("dob");
    }
  }

  function handleZipChange(event) {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, ZIP_LENGTH);
    setZipCode(digitsOnly);
    if (digitsOnly.length === ZIP_LENGTH) {
      markTouched("zip");
    }
  }

  async function handleNext() {
    if (!isFormValid || isSubmitting) return;

    setSubmitError(null);
    setIsSubmitting(true);

    // Save the entered fields so they can be restored if the user later
    // clicks Back from Page 2.
    const formSnapshot = { firstName: firstName.trim(), lastName: lastName.trim(), dob, zipCode, gender, tobaccoUse };
    setApplicantForm(formSnapshot);
    storeApplicantForm(formSnapshot);

    try {
      const quote = await startQuote({
        application_id: applicationId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        date_of_birth: dob,
        zip_code: zipCode,
        gender,
        tobacco_use: tobaccoUse,
      });

      navigate("/quote", { state: { applicationId, quote } });
    } catch (error) {
      setSubmitError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="pre-qualify-page">
      <Header applicationId={applicationId} />

      <div className="page-content">
        <div className="blue-section">
          <HeroSection />
          {sessionError ? (
            <div className="session-banner session-banner--error">
              Unable to start your session: {sessionError}
            </div>
          ) : (
            <QuoteForm
              firstName={firstName}
              onFirstNameChange={(event) => setFirstName(event.target.value)}
              lastName={lastName}
              onLastNameChange={(event) => setLastName(event.target.value)}
              dob={dob}
              onDobChange={handleDobChange}
              onDobBlur={() => markTouched("dob")}
              dobError={dobError}
              zipCode={zipCode}
              onZipChange={handleZipChange}
              onZipBlur={() => markTouched("zip")}
              zipError={zipError}
              detectedState={detectedState}
              gender={gender}
              onGenderChange={(event) => setGender(event.target.value)}
              onGenderBlur={() => markTouched("gender")}
              genderError={genderError}
              tobaccoUse={tobaccoUse}
              onTobaccoSelect={setTobaccoUse}
              onTobaccoBlur={() => markTouched("tobacco")}
              tobaccoError={tobaccoError}
              submitError={submitError}
            />
          )}
        </div>

        <div className="sticky-nav">
          <hr className="section-separator" />
          <div className="navigation-bar">
            <button
              type="button"
              className="next-btn"
              disabled={!isFormValid || isSubmitting || Boolean(sessionError)}
              onClick={handleNext}
            >
              {isSubmitting ? <span className="next-btn__spinner" aria-hidden="true" /> : "Next"}
            </button>
          </div>
        </div>

        <hr className="section-separator" />
        <Footer />
      </div>
    </div>
  );
}
