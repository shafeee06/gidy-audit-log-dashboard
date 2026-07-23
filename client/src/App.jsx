import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Database, ShieldAlert, Upload, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { DetailDrawer } from './components/DetailDrawer';
import { Filters } from './components/Filters';
import { LogTable } from './components/LogTable';
import { StatCard } from './components/StatCard';
import { UploadModal } from './components/UploadModal';
import { getDashboard, getLogs } from './services/api';

const defaultFilters = { search: '', role: '', action: '', resourceType: '', region: '', severity: '', status: '', startDate: '', endDate: '' };

export default function App() {
  const [filters, setFilters] = useState(defaultFilters);
  const [facets, setFacets] = useState({});
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [toast, setToast] = useState('');

  const query = useMemo(() => ({ ...filters, page: pagination.page, limit: 25, sortBy, sortOrder }), [filters, pagination.page, sortBy, sortOrder]);

  const loadLogs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getLogs(query);
      setLogs(Array.isArray(data?.items) ? data.items : []);
      setPagination(data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to the audit log API.');
    } finally { setLoading(false); }
  }, [query]);

  const refreshAll = useCallback(async () => {
    try {
      const dashboard = await getDashboard();
      setFacets(dashboard?.facets || {}); setStats(dashboard?.stats || {});
    } catch (err) {
      setError(err.response?.data?.message || 'API is unavailable. Start MongoDB and the server, then refresh.');
    }
    await loadLogs();
  }, [loadLogs]);

  useEffect(() => { const id = setTimeout(loadLogs, 250); return () => clearTimeout(id); }, [loadLogs]);
  useEffect(() => { getDashboard().then((data) => { setFacets(data?.facets || {}); setStats(data?.stats || {}); }).catch(() => {}); }, []);

  function changeFilter(field, value) { setFilters((current) => ({ ...current, [field]: value })); setPagination((p) => ({ ...p, page: 1 })); }
  function changeSort(field) { if (sortBy === field) setSortOrder((v) => v === 'asc' ? 'desc' : 'asc'); else { setSortBy(field); setSortOrder('asc'); } setPagination((p) => ({ ...p, page: 1 })); }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><ShieldAlert /></div>
        <div><p className="eyebrow">SECURITY OPERATIONS</p><h1>Sentinel Audit Console</h1></div>
        <div className="topbar-actions">
          <button className="icon-button" onClick={refreshAll} aria-label="Refresh"><RefreshCw size={19} /></button>
          <button className="primary-button" onClick={() => setUploadOpen(true)}><Upload size={18} /> Bulk upload</button>
        </div>
      </header>

      <main>
        <section className="hero-copy"><div><h2>Investigate system activity at scale.</h2><p>Server-side search, filters, sorting, and pagination for high-volume audit data.</p></div><span className="live-indicator"><i /> Live data</span></section>
        <section className="stats-grid">
          <StatCard label="Total logs" value={stats.total} helper="All ingested records" icon={Database} />
          <StatCard label="Unresolved" value={stats.unresolved} helper="Requires review" icon={AlertTriangle} />
          <StatCard label="Critical events" value={stats.critical} helper="Highest severity" icon={ShieldAlert} />
          <StatCard label="Last 24 hours" value={stats.last24Hours} helper="Recent activity" icon={Activity} />
        </section>

        <Filters filters={filters} facets={facets} onChange={changeFilter} onReset={() => { setFilters(defaultFilters); setPagination((p) => ({ ...p, page: 1 })); }} />
        {error && <div className="error-banner">{error}</div>}
        <section className="data-panel">
          <div className="panel-header"><div><h2>Audit events</h2><p>{pagination.total?.toLocaleString() || 0} matching records</p></div><span>Page {pagination.page} of {pagination.totalPages}</span></div>
          <LogTable logs={logs} loading={loading} sortBy={sortBy} sortOrder={sortOrder} onSort={changeSort} onSelect={setSelectedLog} />
          <div className="pagination">
            <button disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}><ChevronLeft size={17} /> Previous</button>
            <span>{pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total?.toLocaleString() || 0}</span>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>Next <ChevronRight size={17} /></button>
          </div>
        </section>
      </main>
      {toast && <div className="success-toast" role="status">{toast}</div>}
      <UploadModal open={uploadOpen} existingCount={stats.total || 0} onClose={() => setUploadOpen(false)} onUploaded={refreshAll} onSuccess={(text) => { setToast(text); setTimeout(() => setToast(''), 3500); }} />
      <DetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
