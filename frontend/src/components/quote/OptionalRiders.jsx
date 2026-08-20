import { useState } from "react";
import { formatCurrencyWithCents } from "../../utils/currency";
import "./OptionalRiders.css";

export default function OptionalRiders({ isOn, onToggle, isToggling, riderMonthly, riderAnnual, premiumBasis }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedCount = isOn ? 1 : 0;
  const riderPremium = premiumBasis === "annual" ? riderAnnual : riderMonthly;
  const unitLabel = premiumBasis === "annual" ? "/yr" : "/month";

  return (
    <div className="optional-riders">
      <button
        type="button"
        className="optional-riders__header"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
      >
        <span>
          OPTIONAL RIDERS <span className="optional-riders__count">{selectedCount} of 1</span>
        </span>
        <span className={`optional-riders__arrow ${isExpanded ? "optional-riders__arrow--up" : ""}`}>
          ^
        </span>
      </button>

      {isExpanded && (
        <div className="optional-riders__body">
          <button
            type="button"
            className={`toggle-switch ${isOn ? "toggle-switch--on" : ""}`}
            role="switch"
            aria-checked={isOn}
            aria-label="Accidental Death Benefit Rider"
            disabled={isToggling}
            onClick={onToggle}
          >
            <span className="toggle-switch__knob" />
          </button>
          <div className="optional-riders__text">
            <div className="optional-riders__title">Accidental Death Benefit Rider</div>
            <div className="optional-riders__subtitle">
              Doubles the Death Benefit if the Insured dies by Accidental Death
            </div>
            {isOn && riderPremium != null && (
              <div className="optional-riders__premium">
                + {formatCurrencyWithCents(riderPremium)} {unitLabel}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
