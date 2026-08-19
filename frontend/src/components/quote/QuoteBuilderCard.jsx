import SegmentedToggle from "./SegmentedToggle";
import RateClassTable from "./RateClassTable";
import OptionalRiders from "./OptionalRiders";
import { formatWholeCurrency, parseCurrencyDigits } from "../../utils/currency";
import "./QuoteBuilderCard.css";

const QUOTE_BY_OPTIONS = [
  { value: "coverage", label: "Coverage" },
  { value: "premium", label: "Monthly Premium", disabled: true },
];

export default function QuoteBuilderCard({
  coverageAmount,
  onCoverageAmountChange,
  coverageError,
  rateClasses,
  selectedRateClass,
  onSelectRateClass,
  premiumBasis,
}) {
  function handleCoverageInputChange(event) {
    const digits = parseCurrencyDigits(event.target.value);
    onCoverageAmountChange(digits);
  }

  return (
    <div className="quote-builder-card">
      <div className="quote-builder-card__header">
        <h2 className="quote-builder-card__title">Quote Builder</h2>
        <div className="quote-builder-card__quote-by">
          <span className="quote-builder-card__quote-by-label">QUOTE BY</span>
          <SegmentedToggle options={QUOTE_BY_OPTIONS} value="coverage" onChange={() => {}} ariaLabel="Quote by" />
        </div>
      </div>

      <div className="quote-builder-content">
        <div className="amount-section">
          <div className="amount-field">
            <label className="amount-field__label" htmlFor="coverageAmount">
              Amount
            </label>
            <input
              id="coverageAmount"
              className="amount-field__input"
              value={formatWholeCurrency(coverageAmount)}
              onChange={handleCoverageInputChange}
              inputMode="numeric"
            />
            {coverageError && <p className="amount-field__error">{coverageError}</p>}
          </div>
        </div>

        <div className="rate-class-section">
          <div className="rate-class-header">
            <span className="rate-class-header__label">Rate Class</span>
            <button type="button" className="build-chart-btn">
              Build Chart
            </button>
          </div>

          <RateClassTable
            rateClasses={rateClasses}
            selectedRateClass={selectedRateClass}
            onSelect={onSelectRateClass}
            premiumBasis={premiumBasis}
          />
        </div>
      </div>

      <OptionalRiders />
    </div>
  );
}
