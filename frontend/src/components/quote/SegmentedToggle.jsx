import "./SegmentedToggle.css";

// options: [{ value, label, disabled? }]
export default function SegmentedToggle({ options, value, onChange, ariaLabel }) {
  return (
    <div className="segmented-toggle" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segmented-toggle__btn ${value === option.value ? "segmented-toggle__btn--active" : ""}`}
          disabled={option.disabled}
          onClick={() => !option.disabled && onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
