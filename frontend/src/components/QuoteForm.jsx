import { FloatingInput, FloatingSelect } from "./FloatingField";
import InfoIcon from "./InfoIcon";
import "./QuoteForm.css";

export default function QuoteForm({
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  dob,
  onDobChange,
  onDobBlur,
  dobError,
  zipCode,
  onZipChange,
  onZipBlur,
  zipError,
  detectedState,
  gender,
  onGenderChange,
  onGenderBlur,
  genderError,
  tobaccoUse,
  onTobaccoSelect,
  onTobaccoBlur,
  tobaccoError,
  submitError,
}) {
  return (
    <div className="quote-form-wrapper">
      <div className="quote-form-card">
        <div className="quote-form-card__fields">
          <div className="name-row">
            <FloatingInput
              id="firstName"
              label="Legal First Name"
              value={firstName}
              onChange={onFirstNameChange}
              autoComplete="given-name"
              placeholder="First name"
            />

            <FloatingInput
              id="lastName"
              label="Legal Last Name"
              value={lastName}
              onChange={onLastNameChange}
              autoComplete="family-name"
              placeholder="Last name"
            />
          </div>

          <div className="form-row">
            <FloatingInput
              id="dob"
              label="Date of Birth"
              value={dob}
              onChange={onDobChange}
              onBlur={onDobBlur}
              error={dobError}
              inputMode="numeric"
              autoComplete="bday"
              placeholder="MM/DD/YYYY"
            />

            <FloatingSelect
              id="gender"
              label="Gender (At Birth)"
              value={gender}
              onChange={onGenderChange}
              onBlur={onGenderBlur}
              error={genderError}
              options={["Male", "Female"]}
            />
          </div>

          <div>
            <FloatingInput
              id="zipCode"
              label="Residence Zip Code"
              value={zipCode}
              onChange={onZipChange}
              onBlur={onZipBlur}
              error={zipError}
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="00000"
              maxLength={5}
            />
            {detectedState && (
              <p className="zip-detected-state">
                <span className="zip-detected-state__value">
                  {detectedState.abbreviation} — {detectedState.name}
                </span>{" "}
                <span className="zip-detected-state__hint">(from ZIP)</span>
              </p>
            )}
          </div>

          <div className="tobacco-question">
            <div className="tobacco-question__label">
              <span>Have you used tobacco in any form in the last 12 months?</span>
              <InfoIcon label="Tobacco use information" />
            </div>
            <div className="tobacco-toggle" role="group" aria-label="Tobacco use">
              <button
                type="button"
                className={`toggle-btn ${tobaccoUse === true ? "toggle-btn--active" : ""}`}
                onClick={() => onTobaccoSelect(true)}
                onBlur={onTobaccoBlur}
              >
                Yes
              </button>
              <button
                type="button"
                className={`toggle-btn ${tobaccoUse === false ? "toggle-btn--active" : ""}`}
                onClick={() => onTobaccoSelect(false)}
                onBlur={onTobaccoBlur}
              >
                No
              </button>
            </div>
            {tobaccoError && <p className="field__error">{tobaccoError}</p>}
          </div>
        </div>

        {submitError && <p className="quote-form-card__error">{submitError}</p>}
      </div>
    </div>
  );
}
