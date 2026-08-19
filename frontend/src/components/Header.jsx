import ArrowIcon from "./ArrowIcon";
import "./Header.css";

const AGENT_NAME = "Agent Name";

export default function Header({ applicationId, applicantSummary }) {
  return (
    <header className="app-header">
      <div className="app-header__left">
        <div className="app-header__brand">
          NewBridge<span className="app-header__trademark">™</span>
        </div>
      </div>

      <div className="header-right-group">
        <div className="header-info">
          {applicantSummary && <div className="applicant-info">{applicantSummary}</div>}
          <div className="app-id-section">
            <div className="app-id-value">{applicationId || "—"}</div>
            <div className="app-id-label">Application ID Number</div>
          </div>
        </div>

        <div className="app-header__actions">
          <button type="button" className="btn btn--outline">
            Product Guide
          </button>
          <button type="button" className="btn btn--lavender">
            Contact Support
          </button>
          <button type="button" className="btn btn--lavender btn--agent">
            Agent {AGENT_NAME}
            <ArrowIcon label="Agent options" />
          </button>
        </div>
      </div>
    </header>
  );
}
