import { formatCurrencyWithCents } from "../../utils/currency";
import "./RateClassTable.css";

export default function RateClassTable({ rateClasses, selectedRateClass, onSelect, premiumBasis }) {
  const columnLabel = premiumBasis === "annual" ? "ANNUAL PREMIUM" : "MONTHLY PREMIUM";

  return (
    <div className="rate-class-table">
      <div className="rate-class-table__header">
        <span>RATE CLASS</span>
        <span>{columnLabel}</span>
      </div>

      {rateClasses.map((rateClass) => {
        const isSelected = rateClass.name === selectedRateClass;
        const premium = premiumBasis === "annual" ? rateClass.annual : rateClass.monthly;

        return (
          <label
            key={rateClass.name}
            className={`rate-class-row ${!rateClass.eligible ? "rate-class-row--disabled" : ""} ${
              isSelected ? "rate-class-row--selected" : ""
            }`}
          >
            <span className="rate-class-row__name">
              <input
                type="radio"
                name="rate-class"
                className="rate-class-row__radio"
                checked={isSelected}
                disabled={!rateClass.eligible}
                onChange={() => onSelect(rateClass.name)}
              />
              {rateClass.name}
            </span>
            <span className="rate-class-row__premium">
              {rateClass.eligible ? formatCurrencyWithCents(premium) : "N/A"}
            </span>
          </label>
        );
      })}
    </div>
  );
}
