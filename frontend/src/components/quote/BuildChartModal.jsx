import { useEffect } from "react";
import { createPortal } from "react-dom";
import { BUILD_CHART_ROWS } from "../../data/buildChartData";
import "./BuildChartModal.css";

function formatRange([min, max]) {
  return `${min} – ${max}`;
}

export default function BuildChartModal({ onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Rendered into document.body so this fixed-position overlay isn't
  // trapped under the Header by an ancestor's stacking context (e.g.
  // .quote-page__main-card sets position: relative; z-index: 1).
  return createPortal(
    <div className="build-chart-overlay" onClick={onClose}>
      <div
        className="build-chart-frame"
        role="dialog"
        aria-modal="true"
        aria-label="Height & Weight Build Chart"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="build-chart-close" aria-label="Close build chart" onClick={onClose}>
          &times;
        </button>

        <div className="build-chart-card">
          <div className="build-chart-table-wrapper">
            <table className="build-chart-table">
              <colgroup>
                <col className="build-chart-table__col-height" />
                <col className="build-chart-table__col-range" />
                <col className="build-chart-table__col-range" />
                <col className="build-chart-table__col-range" />
              </colgroup>
              <thead>
                <tr>
                  <th>Height (Feet)</th>
                  <th>Preferred</th>
                  <th>Standard</th>
                  <th>Modified</th>
                </tr>
              </thead>
              <tbody>
                {BUILD_CHART_ROWS.map((row) => (
                  <tr key={row.height} className={row.highlighted ? "build-chart-row--highlighted" : ""}>
                    <td>{row.height}</td>
                    <td>{formatRange(row.preferred)}</td>
                    <td>{formatRange(row.standard)}</td>
                    <td>{formatRange(row.modified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
