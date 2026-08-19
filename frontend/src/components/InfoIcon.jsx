export default function InfoIcon({ label }) {
  return (
    <svg
      className="info-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      role="img"
      aria-label={label || "More information"}
    >
      <circle cx="8" cy="8" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7.25" y="6.75" width="1.5" height="5" rx="0.75" fill="currentColor" />
      <circle cx="8" cy="4.25" r="0.9" fill="currentColor" />
    </svg>
  );
}
