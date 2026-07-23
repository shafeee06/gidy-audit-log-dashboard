import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

const columns = [
  ['timestamp', 'Timestamp'], ['actor', 'Actor'], ['role', 'Role'], ['action', 'Action'],
  ['resourceType', 'Resource'], ['ipAddress', 'IP address'], ['region', 'Region'], ['severity', 'Severity'], ['status', 'Status']
];

function SortIcon({ active, direction }) {
  if (!active) return <ChevronsUpDown size={14} />;
  return direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}

export function LogTable({ logs, loading, sortBy, sortOrder, onSort, onSelect }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map(([key, label]) => (
          <th key={key}>
            <button onClick={() => onSort(key)}>{label}<SortIcon active={sortBy === key} direction={sortOrder} /></button>
          </th>
        ))}</tr></thead>
        <tbody>
          {loading ? <tr><td colSpan="9"><div className="empty-state">Loading audit logs...</div></td></tr> :
          logs.length === 0 ? <tr><td colSpan="9"><div className="empty-state">No logs match the current query.</div></td></tr> :
          logs.map((log) => (
            <tr key={log._id} onClick={() => onSelect(log)}>
              <td className="mono nowrap">{new Date(log.timestamp).toLocaleString()}</td>
              <td>{log.actor}</td>
              <td><span className="role-pill">{log.role}</span></td>
              <td className="mono">{log.action}</td>
              <td><strong>{log.resourceType}</strong><small>{log.resource}</small></td>
              <td className="mono">{log.ipAddress}</td>
              <td>{log.region}</td>
              <td><span className={`badge severity-${log.severity.toLowerCase()}`}>{log.severity}</span></td>
              <td><span className={`badge status-${log.status.toLowerCase().replaceAll(' ', '-')}`}>{log.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
