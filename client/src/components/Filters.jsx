import { RotateCcw, Search } from 'lucide-react';

const selectFields = [
  ['role', 'Role', 'roles'],
  ['action', 'Action', 'actions'],
  ['resourceType', 'Resource type', 'resourceTypes'],
  ['region', 'Region', 'regions'],
  ['severity', 'Severity', 'severities'],
  ['status', 'Status', 'statuses']
];

export function Filters({ filters, facets, onChange, onReset }) {
  return (
    <section className="filters-panel">
      <div className="search-box">
        <Search size={18} />
        <input
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          placeholder="Search actor, action, resource, IP..."
          aria-label="Search audit logs"
        />
      </div>

      <div className="filter-grid">
        {selectFields.map(([field, label, facetKey]) => (
          <label key={field}>
            <span>{label}</span>
            <select value={filters[field]} onChange={(event) => onChange(field, event.target.value)}>
              <option value="">All</option>
              {[...(facets?.[facetKey] || [])].sort().map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        ))}
        <label>
          <span>From</span>
          <input type="date" value={filters.startDate} onChange={(event) => onChange('startDate', event.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={filters.endDate} onChange={(event) => onChange('endDate', event.target.value)} />
        </label>
      </div>

      <button className="text-button" type="button" onClick={onReset}>
        <RotateCcw size={16} /> Reset filters
      </button>
    </section>
  );
}
