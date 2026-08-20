import SegmentedToggle from "./SegmentedToggle";
import { formatCurrencyWithCents, splitPremiumParts } from "../../utils/currency";
import "./PolicyTotalCard.css";

const BASIS_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

export default function PolicyTotalCard({
  coverageAmount,
  selectedRateClassData,
  premiumBasis,
  onPremiumBasisChange,
  riderOn,
  riderMonthly,
  riderAnnual,
}) {
  const basePremium =
    premiumBasis === "annual" ? selectedRateClassData?.annual : selectedRateClassData?.monthly;
  const riderPremium = riderOn ? (premiumBasis === "annual" ? riderAnnual : riderMonthly) : 0;
  const totalPremium = basePremium != null ? basePremium + riderPremium : null;
  const { whole, cents } = splitPremiumParts(totalPremium);
  const unitLabel = premiumBasis === "annual" ? "/yr" : "/ month";
  const basePremiumUnit = premiumBasis === "annual" ? "/yr" : "/mo";

  return (
    <div className="policy-total-column">
      <div className="policy-total-brand">
        <span className="policy-total-brand__name">NewBridge™</span>
        <span className="policy-total-brand__product"> | Final Expense</span>
      </div>

      <div className="policy-total-card">
        <span className="policy-total-card__badge">POLICY TOTAL</span>

        <div className="policy-total-card__total-row">
          <span className="policy-total-card__total-label">TOTAL</span>
          <SegmentedToggle
            options={BASIS_OPTIONS}
            value={premiumBasis}
            onChange={onPremiumBasisChange}
            ariaLabel="Premium basis"
          />
        </div>

        <div className="policy-total-card__premium">
          <span className="policy-total-card__premium-whole">{whole}</span>
          <span className="policy-total-card__premium-cents">{cents}</span>
          <span className="policy-total-card__premium-unit">{unitLabel}</span>
        </div>

        <div className="policy-total-card__details">
          <div className="policy-total-card__detail-row">
            <span>Coverage</span>
            <span className="policy-total-card__detail-value--strong">
              {formatCurrencyWithCents(coverageAmount)}
            </span>
          </div>
          <div className="policy-total-card__detail-row">
            <span>Rate class</span>
            <span className="policy-total-card__detail-value--strong">
              {selectedRateClassData?.name ?? "—"}
            </span>
          </div>
          <div className="policy-total-card__dotted-separator" />
          <div className="policy-total-card__detail-row policy-total-card__detail-row--base">
            <span>Base premium</span>
            <span>
              {formatCurrencyWithCents(basePremium)} {basePremiumUnit}
            </span>
          </div>
          {riderOn && (
            <div className="policy-total-card__detail-row policy-total-card__detail-row--rider">
              <span>Accidental Death Benefit Rider</span>
              <span>
                + {formatCurrencyWithCents(riderPremium)} {basePremiumUnit}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="policy-total-riders">
        <div className="policy-total-riders__title">RIDERS INCLUDED AT NO COST:</div>
        <div className="policy-total-riders__item">
          <span className="policy-total-riders__check">✓</span>
          Accelerated Death Benefit Rider for Terminal Illness
        </div>
      </div>
    </div>
  );
}
