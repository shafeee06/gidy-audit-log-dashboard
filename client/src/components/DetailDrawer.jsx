import { X } from 'lucide-react';

export function DetailDrawer({ log, onClose }) {
  if (!log) return null;
  const fields = ['actor', 'role', 'action', 'resource', 'resourceType', 'ipAddress', 'region', 'severity', 'status', 'timestamp'];
  return (
    <div className="drawer-backdrop" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header"><div><p className="eyebrow">INVESTIGATION</p><h2>Log details</h2></div><button className="icon-button" onClick={onClose}><X /></button></div>
        <div className="detail-list">{fields.map((field) => <div key={field}><span>{field}</span><strong>{field === 'timestamp' ? new Date(log[field]).toLocaleString() : log[field]}</strong></div>)}</div>
        <h3>Raw record</h3>
        <pre>{JSON.stringify(log, null, 2)}</pre>
      </aside>
    </div>
  );
}
