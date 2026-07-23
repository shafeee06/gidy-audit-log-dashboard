export function StatCard({ label, value, helper, icon: Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <p>{label}</p>
        <strong>{Number(value || 0).toLocaleString()}</strong>
        <span>{helper}</span>
      </div>
    </article>
  );
}
