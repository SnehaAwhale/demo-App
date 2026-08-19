export default function ArrowIcon({ label }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      role="img"
      aria-label={label || "Expand"}
    >
      <circle cx="9" cy="9" r="9" fill="currentColor" opacity="0.15" />
      <path
        d="M6 7.5L9 10.5L12 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
