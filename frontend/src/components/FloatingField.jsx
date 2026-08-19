import "./FloatingField.css";

export function FloatingInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  inputMode,
  autoComplete,
  placeholder,
  maxLength,
}) {
  return (
    <div className={`form-group ${error ? "form-group--error" : ""}`}>
      <label htmlFor={id} className="floating-label">
        {label} <span className="asterisk">*</span>
      </label>
      <input
        id={id}
        className="form-input"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}

export function FloatingSelect({ id, label, value, onChange, onBlur, error, options, placeholder = "Select" }) {
  return (
    <div className={`form-group ${error ? "form-group--error" : ""}`}>
      <label htmlFor={id} className="floating-label">
        {label} <span className="asterisk">*</span>
      </label>
      <select id={id} className="form-input" value={value} onChange={onChange} onBlur={onBlur}>
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
