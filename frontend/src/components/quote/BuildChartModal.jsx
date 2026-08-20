import { useEffect } from "react";
import { createPortal } from "react-dom";
import { BUILD_CHART_ROWS } from "../../data/buildChartData";
import "./BuildChartModal.css";

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
              <thead>
                <tr>
                  <th rowSpan={2} className="build-chart-table__height-header">
                    Height (Feet)
                  </th>
                  <th colSpan={2}>Preferred</th>
                  <th colSpan={2}>Standard</th>
                  <th colSpan={2}>Modified</th>
                </tr>
                <tr>
                  <th className="build-chart-table__sub-header">Min Weight (lbs)</th>
                  <th className="build-chart-table__sub-header">Max Weight (lbs)</th>
                  <th className="build-chart-table__sub-header">Min Weight (lbs)</th>
                  <th className="build-chart-table__sub-header">Max Weight (lbs)</th>
                  <th className="build-chart-table__sub-header">Min Weight (lbs)</th>
                  <th className="build-chart-table__sub-header">Max Weight (lbs)</th>
                </tr>
              </thead>
              <tbody>
                {BUILD_CHART_ROWS.map((row) => (
                  <tr key={row.height} className={row.highlighted ? "build-chart-row--highlighted" : ""}>
                    <td>{row.height}</td>
                    <td>{row.preferred[0]}</td>
                    <td>{row.preferred[1]}</td>
                    <td>{row.standard[0]}</td>
                    <td>{row.standard[1]}</td>
                    <td>{row.modified[0]}</td>
                    <td>{row.modified[1]}</td>
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
