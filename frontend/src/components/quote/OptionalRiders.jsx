import { useState } from "react";
import "./OptionalRiders.css";

export default function OptionalRiders() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAccidentalDeathOn, setIsAccidentalDeathOn] = useState(false);

  const selectedCount = isAccidentalDeathOn ? 1 : 0;

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
            className={`toggle-switch ${isAccidentalDeathOn ? "toggle-switch--on" : ""}`}
            role="switch"
            aria-checked={isAccidentalDeathOn}
            aria-label="Accidental Death Benefit Rider"
            onClick={() => setIsAccidentalDeathOn((prev) => !prev)}
          >
            <span className="toggle-switch__knob" />
          </button>
          <div className="optional-riders__text">
            <div className="optional-riders__title">Accidental Death Benefit Rider</div>
            <div className="optional-riders__subtitle">
              Doubles the Death Benefit if the Insured dies by Accidental Death
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
