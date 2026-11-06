import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Modal } from '../common/Modal';
import { assetAssignmentService } from '../../services/assetAssignmentService';
import type { Asset } from '../../types/asset';
import type { Employee } from '../../types/employee';
import { todayISO, addDaysISO, formatDate, dueInfo, DUE_COLORS } from '../../utils/dates';

const labelStyle: React.CSSProperties = { fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' };
const hintStyle: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem', display: 'block' };
const chipBtn: React.CSSProperties = { padding: '0.2rem 0.55rem', fontSize: '0.72rem' };

const apiError = (err: any, fallback: string): string => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d: any) => d.msg).join(', ');
  return fallback;
};

const ErrorBox: React.FC<{ message: string | null }> = ({ message }) =>
  message ? (
    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
      {message}
    </div>
  ) : null;

const Actions: React.FC<{ onCancel: () => void; submitting: boolean; disabled?: boolean; label: string; busyLabel: string }> = ({ onCancel, submitting, disabled, label, busyLabel }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
    <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
    <button type="submit" disabled={submitting || disabled} className="btn btn-primary">{submitting ? busyLabel : label}</button>
  </div>
);

/* ------------------------------------------------------------------ */

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Asset being assigned. When omitted the user picks from `availableAssets`. */
  asset?: Asset | null;
  availableAssets?: Asset[];
  employees: Employee[];
}

export const AssignAssetDialog: React.FC<AssignDialogProps> = ({ open, onClose, onSaved, asset, availableAssets = [], employees }) => {
  const activeEmployees = employees.filter((e) => e.status === 'Active');
  const [assetId, setAssetId] = useState(0);
  const [employeeId, setEmployeeId] = useState(0);
  const [assignedDate, setAssignedDate] = useState(todayISO());
  const [expectedReturn, setExpectedReturn] = useState('');
  const [condition, setCondition] = useState('Good');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form each time the dialog opens
  useEffect(() => {
    if (!open) return;
    const first = asset ?? availableAssets[0];
    setAssetId(first?.asset_id ?? 0);
    setEmployeeId(activeEmployees[0]?.employee_id ?? 0);
    setAssignedDate(todayISO());
    setExpectedReturn('');
    setCondition(first?.condition && first.condition !== 'Damaged' ? first.condition : 'Good');
    setRemarks('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !employeeId) return;
    setSubmitting(true);
    setError(null);
    try {
      await assetAssignmentService.assignAsset({
        asset_id: assetId,
        employee_id: employeeId,
        assigned_date: assignedDate || undefined,
        expected_return_date: expectedReturn || undefined,
        condition_on_assignment: condition,
        remarks: remarks || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiError(err, 'Failed to assign asset to employee.'));
    } finally {
      setSubmitting(false);
    }
  };

  const title = asset ? `Assign Asset: ${asset.asset_name} (${asset.asset_code})` : 'New Asset Assignment';

  return (
    <Modal isOpen={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ErrorBox message={error} />

        {!asset && (
          <div>
            <label style={labelStyle}>Asset *</label>
            <select required className="input-control" value={assetId} onChange={(e) => setAssetId(parseInt(e.target.value))}>
              {availableAssets.length > 0 ? (
                availableAssets.map((a) => (
                  <option key={a.asset_id} value={a.asset_id}>{a.asset_code} — {a.asset_name}</option>
                ))
              ) : (
                <option value={0}>No available assets</option>
              )}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>Employee *</label>
          <select required className="input-control" value={employeeId} onChange={(e) => setEmployeeId(parseInt(e.target.value))}>
            {activeEmployees.length > 0 ? (
              activeEmployees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.employee_name} ({emp.employee_code}) - {emp.position || 'Staff'}
                </option>
              ))
            ) : (
              <option value={0}>No active employees found</option>
            )}
          </select>
        </div>

        <div className="form-grid-2">
          <div>
            <label style={labelStyle}>Assigned Date *</label>
            <input
              type="date" required className="input-control" value={assignedDate} max={todayISO()}
              onChange={(e) => {
                setAssignedDate(e.target.value);
                if (expectedReturn && expectedReturn < e.target.value) setExpectedReturn('');
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>Expected Return Date <span style={{ color: 'var(--text-dim)' }}>(optional)</span></label>
            <input type="date" className="input-control" value={expectedReturn} min={assignedDate}
              onChange={(e) => setExpectedReturn(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '-0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Return in:</span>
          {[1, 7, 14, 30].map((d) => (
            <button key={d} type="button" className="btn btn-secondary" style={chipBtn}
              onClick={() => setExpectedReturn(addDaysISO(assignedDate || todayISO(), d))}>
              {d === 1 ? '1 day' : `${d} days`}
            </button>
          ))}
          <button type="button" className="btn btn-secondary" style={chipBtn} onClick={() => setExpectedReturn('')}>
            No return date
          </button>
        </div>
        <span style={{ ...hintStyle, marginTop: '-0.6rem' }}>
          Leave the return date empty for a permanent handover (e.g. a staff laptop). Set it for a loan — the assignment shows as Overdue if not returned by then.
        </span>

        <div>
          <label style={labelStyle}>Condition on Assignment</label>
          <select className="input-control" value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Remarks / Notes</label>
          <textarea className="input-control" rows={2} placeholder="e.g. Issued for remote developer setup..."
            value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>

        <Actions onCancel={onClose} submitting={submitting} disabled={!assetId || !employeeId}
          label="Confirm & Assign" busyLabel="Assigning..." />
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */

export interface ReturnTarget {
  assignment_id: number;
  asset_label: string;
  employee_label: string;
  assigned_date?: string;
  expected_return_date?: string | null;
  condition?: string;
}

interface ReturnDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  target: ReturnTarget | null;
}

export const ReturnAssetDialog: React.FC<ReturnDialogProps> = ({ open, onClose, onSaved, target }) => {
  const [returnedDate, setReturnedDate] = useState(todayISO());
  const [condition, setCondition] = useState('Good');
  const [statusAfter, setStatusAfter] = useState('Available');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReturnedDate(todayISO());
    setCondition(target?.condition || 'Good');
    setStatusAfter('Available');
    setRemarks('');
    setError(null);
  }, [open, target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setError(null);
    try {
      await assetAssignmentService.returnAsset(target.assignment_id, {
        returned_date: returnedDate || undefined,
        condition_on_return: condition,
        status_on_return: statusAfter,
        remarks: remarks || undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiError(err, 'Failed to return asset.'));
    } finally {
      setSubmitting(false);
    }
  };

  const due = dueInfo(target?.expected_return_date, 'Assigned');

  return (
    <Modal isOpen={open} onClose={onClose} title={`Return Asset: ${target?.asset_label ?? ''}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ErrorBox message={error} />

        <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
          Held by <strong>{target?.employee_label}</strong><br />
          Assigned on <strong>{formatDate(target?.assigned_date)}</strong>
          {target?.expected_return_date && (
            <> · expected back <strong>{formatDate(target.expected_return_date)}</strong>{' '}
              <span style={{ color: DUE_COLORS[due.state], fontWeight: 700 }}>({due.text})</span></>
          )}
        </div>

        <div>
          <label style={labelStyle}>Returned Date *</label>
          <input type="date" required className="input-control" value={returnedDate}
            min={target?.assigned_date} max={todayISO()} onChange={(e) => setReturnedDate(e.target.value)} />
        </div>

        <div className="form-grid-2">
          <div>
            <label style={labelStyle}>Condition on Return</label>
            <select className="input-control" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status after Return</label>
            <select className="input-control" value={statusAfter} onChange={(e) => setStatusAfter(e.target.value)}>
              <option value="Available">Available (Back in storage)</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Return Remarks / Notes</label>
          <textarea className="input-control" rows={2} placeholder="e.g. Returned after project completion, verified condition..."
            value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>

        <Actions onCancel={onClose} submitting={submitting} label="Confirm Return" busyLabel="Processing..." />
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */

interface DueDateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  target: ReturnTarget | null;
}

export const DueDateDialog: React.FC<DueDateDialogProps> = ({ open, onClose, onSaved, target }) => {
  const [due, setDue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDue(target?.expected_return_date || '');
    setError(null);
  }, [open, target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    setError(null);
    try {
      await assetAssignmentService.updateAssignment(target.assignment_id, { expected_return_date: due || null });
      onSaved();
      onClose();
    } catch (err) {
      setError(apiError(err, 'Failed to update the return date.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={`Change Return Date: ${target?.asset_label ?? ''}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ErrorBox message={error} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <CalendarClock size={16} /> Held by <strong style={{ color: 'var(--text-main)' }}>{target?.employee_label}</strong> since {formatDate(target?.assigned_date)}
        </div>
        <div>
          <label style={labelStyle}>Expected Return Date</label>
          <input type="date" className="input-control" value={due} min={target?.assigned_date} onChange={(e) => setDue(e.target.value)} />
          <span style={hintStyle}>Clear the date to make this a permanent handover.</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[7, 14, 30].map((d) => (
            <button key={d} type="button" className="btn btn-secondary" style={chipBtn}
              onClick={() => setDue(addDaysISO(todayISO(), d))}>+{d} days from today</button>
          ))}
          <button type="button" className="btn btn-secondary" style={chipBtn} onClick={() => setDue('')}>No return date</button>
        </div>
        <Actions onCancel={onClose} submitting={submitting} label="Save Return Date" busyLabel="Saving..." />
      </form>
    </Modal>
  );
};
