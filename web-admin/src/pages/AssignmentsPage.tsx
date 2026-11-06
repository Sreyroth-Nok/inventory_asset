import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, RefreshCw, UserX, CalendarClock, AlertTriangle, PackageCheck, Clock, Undo2 } from 'lucide-react';
import type { AssetAssignmentResponse } from '../types/assetAssignment';
import type { Asset } from '../types/asset';
import type { Employee } from '../types/employee';
import { assetAssignmentService } from '../services/assetAssignmentService';
import { assetService } from '../services/assetService';
import { employeeService } from '../services/employeeService';
import { authService } from '../services/authService';
import { AssignAssetDialog, ReturnAssetDialog, DueDateDialog, type ReturnTarget } from '../components/assignments/AssignmentDialogs';
import { formatDate, dueInfo, daysBetween, todayISO, DUE_COLORS } from '../utils/dates';

type Tab = 'all' | 'active' | 'overdue' | 'returned';

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'returned', label: 'Returned' },
];

const toTarget = (a: AssetAssignmentResponse): ReturnTarget => ({
  assignment_id: a.assignment_id,
  asset_label: a.asset ? `${a.asset.asset_name} (${a.asset.asset_code})` : `Asset #${a.asset_id}`,
  employee_label: a.employee ? `${a.employee.employee_name} (${a.employee.employee_code})` : `Employee #${a.employee_id}`,
  assigned_date: a.assigned_date,
  expected_return_date: a.expected_return_date,
  condition: a.asset?.condition,
});

const SummaryTile: React.FC<{ label: string; value: number; icon: React.ElementType; color: string; active: boolean; onClick: () => void }> = ({ label, value, icon: Icon, color, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="card"
    style={{
      flex: '1 1 160px', textAlign: 'left', cursor: 'pointer', padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem',
      border: `1px solid ${active ? color : 'var(--border-color)'}`, background: 'var(--bg-card)', color: 'inherit', font: 'inherit',
    }}
  >
    <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card-hover)', color }}>
      <Icon size={19} />
    </div>
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-main)' }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
    </div>
  </button>
);

export const AssignmentsPage: React.FC = () => {
  const [rows, setRows] = useState<AssetAssignmentResponse[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [assignOpen, setAssignOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<ReturnTarget | null>(null);
  const [dueTarget, setDueTarget] = useState<ReturnTarget | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await authService.ensureAuthenticated();
      const [assignments, emps, assets] = await Promise.all([
        assetAssignmentService.getAssignments(),
        employeeService.getEmployees().catch(() => []),
        assetService.getAssets().catch(() => []),
      ]);
      setRows(assignments);
      setEmployees(emps);
      setAvailableAssets(assets.filter((a) => a.status === 'Available'));
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setLoadError('Could not load assignments from the backend API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const counts = useMemo(() => {
    const active = rows.filter((r) => r.status === 'Assigned');
    return {
      active: active.length,
      overdue: active.filter((r) => r.is_overdue).length,
      dueSoon: active.filter((r) => ['today', 'soon'].includes(dueInfo(r.expected_return_date, r.status).state)).length,
      returned: rows.filter((r) => r.status === 'Returned').length,
    };
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === 'active' && r.status !== 'Assigned') return false;
      if (tab === 'overdue' && !r.is_overdue) return false;
      if (tab === 'returned' && r.status !== 'Returned') return false;
      if (fromDate && r.assigned_date < fromDate) return false;
      if (toDate && r.assigned_date > toDate) return false;
      if (q) {
        const hay = [r.asset?.asset_code, r.asset?.asset_name, r.employee?.employee_code, r.employee?.employee_name]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, tab, search, fromDate, toDate]);

  const statusBadge = (r: AssetAssignmentResponse) => {
    if (r.is_overdue) return <span className="badge badge-danger">Overdue</span>;
    if (r.status === 'Assigned') return <span className="badge badge-assigned">Assigned</span>;
    return <span className="badge badge-available">Returned</span>;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <SummaryTile label="Currently assigned" value={counts.active} icon={PackageCheck} color="var(--accent-cyan)" active={tab === 'active'} onClick={() => setTab('active')} />
        <SummaryTile label="Overdue" value={counts.overdue} icon={AlertTriangle} color="var(--accent-rose)" active={tab === 'overdue'} onClick={() => setTab('overdue')} />
        <SummaryTile label="Due within 3 days" value={counts.dueSoon} icon={Clock} color="var(--accent-amber)" active={false} onClick={() => setTab('active')} />
        <SummaryTile label="Returned" value={counts.returned} icon={Undo2} color="var(--accent-emerald)" active={tab === 'returned'} onClick={() => setTab('returned')} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search asset or employee..." className="input-control"
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
          </div>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            Assigned from
            <input type="date" className="input-control" value={fromDate} max={toDate || todayISO()} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            to
            <input type="date" className="input-control" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} />
          </label>
          {(search || fromDate || toDate || tab !== 'all') && (
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}
              onClick={() => { setSearch(''); setFromDate(''); setToDate(''); setTab('all'); }}>
              Clear filters
            </button>
          )}
          <button onClick={fetchAll} className="btn btn-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <button onClick={() => setAssignOpen(true)} className="btn btn-primary">
          <Plus size={18} /> New Assignment
        </button>
      </div>

      {loadError && (
        <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
          {loadError}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Employee</th>
                <th>Assigned</th>
                <th>Expected Return</th>
                <th>Returned</th>
                <th>Condition</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Loading assignment history...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                  {rows.length === 0 ? 'No assets have been assigned yet.' : 'No assignments match these filters.'}
                </td></tr>
              ) : (
                visible.map((r) => {
                  const due = dueInfo(r.expected_return_date, r.status);
                  const end = r.returned_date || todayISO();
                  const held = Math.max(0, daysBetween(r.assigned_date, end));
                  const lateReturn = r.status === 'Returned' && r.expected_return_date && r.returned_date && r.returned_date > r.expected_return_date;
                  return (
                    <tr key={r.assignment_id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#818cf8' }}>{r.asset?.asset_code ?? `#${r.asset_id}`}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>{r.asset?.asset_name}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.employee?.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {r.employee?.employee_code}{r.employee?.department?.department_name ? ` · ${r.employee.department.department_name}` : ''}
                        </div>
                      </td>
                      <td>
                        <div>{formatDate(r.assigned_date)}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>by {r.assigner?.username ?? '—'}</div>
                      </td>
                      <td>
                        {r.expected_return_date ? (
                          <>
                            <div>{formatDate(r.expected_return_date)}</div>
                            {due.text && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: DUE_COLORS[due.state] }}>{due.text}</div>}
                          </>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Permanent</span>
                        )}
                      </td>
                      <td>
                        {r.returned_date ? (
                          <>
                            <div>{formatDate(r.returned_date)}</div>
                            {lateReturn && (
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                                {daysBetween(r.expected_return_date!, r.returned_date)} day(s) late
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ color: 'var(--text-dim)' }}>Not yet</div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {r.returned_date ? 'held' : 'out for'} {held} day{held === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <div>Out: {r.condition_on_assignment || '—'}</div>
                        <div>In: {r.condition_on_return || '—'}</div>
                      </td>
                      <td>{statusBadge(r)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {r.status === 'Assigned' && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                            <button onClick={() => setDueTarget(toTarget(r))} className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem' }} title="Change expected return date" aria-label="Change expected return date">
                              <CalendarClock size={14} />
                            </button>
                            <button onClick={() => setReturnTarget(toTarget(r))} className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }} title="Return asset">
                              <UserX size={13} /> Return
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <div style={{ padding: '0.75rem 1rem 0', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Showing {visible.length} of {rows.length} assignment records
          </div>
        )}
      </div>

      <AssignAssetDialog open={assignOpen} onClose={() => setAssignOpen(false)} onSaved={fetchAll}
        availableAssets={availableAssets} employees={employees} />
      <ReturnAssetDialog open={!!returnTarget} target={returnTarget} onClose={() => setReturnTarget(null)} onSaved={fetchAll} />
      <DueDateDialog open={!!dueTarget} target={dueTarget} onClose={() => setDueTarget(null)} onSaved={fetchAll} />
    </div>
  );
};
