// KPI stat on a glass surface: small uppercase label + big display number.
export default function MetricCard({ label, value }) {
  return (
    <div className="card">
      <div className="kpi-sub">{label}</div>
      <div className="kpi">{value}</div>
    </div>
  );
}
