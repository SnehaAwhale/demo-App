import "./Footer.css";

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__divider" />
      <div className="app-footer__content">
        <div className="app-footer__inner">
          <div className="app-footer__logo">
            <div className="app-footer__logo-circle">CG</div>
          </div>
          <p className="app-footer__disclaimer">
            NewBridge Final Expense (Policy Forms ICC24 CGP1000-24, ICC24 CGP1001-24, and state
            variations thereof), Accelerated Death Benefit Rider for Terminal Illness (Policy Form
            ICC24 CGR3002-24) and Accidental Death Benefit Rider (Policy Form ICC24 CGR3000-24)
            are issued by Continental General Insurance Company. Continental General Insurance
            Company is a stock life, accident, and health insurance company existing under the
            laws of the State of Texas and is a licensed insurance carrier in 49 states, the
            District of Columbia, and the U.S. Virgin Islands. The premiums quoted here are
            non-binding and based on preliminary personal information. The final premium is
            determined during underwriting.
          </p>
        </div>
      </div>
    </footer>
  );
}
