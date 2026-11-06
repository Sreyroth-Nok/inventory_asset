import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, RefreshCw, UserCheck, UserX, User as UserIcon } from 'lucide-react';
import type { Asset, AssetCreate } from '../types/asset';
import type { Employee } from '../types/employee';
import type { AssetCategory } from '../types/category';
import type { Supplier } from '../types/supplier';
import { assetService } from '../services/assetService';
import { employeeService } from '../services/employeeService';
import { categoryService } from '../services/categoryService';
import { supplierService } from '../services/supplierService';
import { authService } from '../services/authService';
import { Modal } from '../components/common/Modal';
import { AssignAssetDialog, ReturnAssetDialog, type ReturnTarget } from '../components/assignments/AssignmentDialogs';
import { formatDate, dueInfo, DUE_COLORS } from '../utils/dates';
import { canDeleteRecords } from '../utils/rbac';

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);


  // Asset CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Assign / Return dialogs (shared with the Assignments page)
  const [assignTarget, setAssignTarget] = useState<Asset | null>(null);
  const [returnTarget, setReturnTarget] = useState<ReturnTarget | null>(null);

  const initialFormState: AssetCreate = {
    asset_code: '',
    asset_name: '',
    category_id: undefined,
    supplier_id: undefined,
    serial_number: '',
    purchase_price: 0,
    condition: 'Good',
    status: 'Available',
    description: ''
  };

  const [formData, setFormData] = useState<AssetCreate>(initialFormState);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      await authService.ensureAuthenticated();
      const [assetData, empData, catData, supData, userProfile] = await Promise.all([
        assetService.getAssets(searchTerm),
        employeeService.getEmployees().catch(() => []),
        categoryService.getCategories().catch(() => []),
        supplierService.getSuppliers().catch(() => []),
        authService.getCurrentUser().catch(() => null)
      ]);
      setAssets(assetData);
      setEmployees(empData);
      setCategories(catData);
      setSuppliers(supData);
      
      const roleStr = typeof userProfile?.role === 'string'
        ? userProfile.role
        : userProfile?.role?.role_name || '';
      setCurrentUserRole(roleStr);
    } catch (err) {
      console.error("Error fetching assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingAsset(null);
    setFormData({
      ...initialFormState,
      category_id: categories.length > 0 ? categories[0].category_id : undefined,
      supplier_id: suppliers.length > 0 ? suppliers[0].supplier_id : undefined,
      asset_code: `AST-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      category_id: asset.category_id || (categories.length > 0 ? categories[0].category_id : undefined),
      supplier_id: asset.supplier_id || (suppliers.length > 0 ? suppliers[0].supplier_id : undefined),
      serial_number: asset.serial_number || '',
      purchase_price: asset.purchase_price ? Number(asset.purchase_price) : 0,
      condition: asset.condition || 'Good',
      status: asset.status,
      description: asset.description || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingAsset) {
        await assetService.updateAsset(editingAsset.asset_id, formData);
      } else {
        await assetService.createAsset(formData);
      }
      setIsModalOpen(false);
      fetchAssets();
    } catch (err: any) {
      console.error("Failed to save asset:", err);
      const detail = err.response?.data?.detail;
      let msg = "Failed to save asset. Please try again.";
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d: any) => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join(', ');
      }
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      try {
        await assetService.deleteAsset(id);
        fetchAssets();
      } catch (err: any) {
        alert(err.response?.data?.detail || "Failed to delete asset. Ensure you have proper permissions.");
      }
    }
  };

  const handleOpenReturnModal = (asset: Asset) => {
    if (!asset.assigned_to) return;
    setReturnTarget({
      assignment_id: asset.assigned_to.assignment_id,
      asset_label: `${asset.asset_name} (${asset.asset_code})`,
      employee_label: `${asset.assigned_to.employee_name} (${asset.assigned_to.employee_code})`,
      assigned_date: asset.assigned_to.assigned_date,
      expected_return_date: asset.assigned_to.expected_return_date,
      condition: asset.condition,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return 'badge-available';
      case 'Assigned': return 'badge-assigned';
      case 'Under Maintenance': return 'badge-warning';
      default: return 'badge-danger';
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search asset code or name..."
              className="input-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button onClick={fetchAssets} className="btn btn-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={18} /> Add New Asset
        </button>
      </div>

      {/* Asset Table Card */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Asset Name</th>
                <th>Serial No.</th>
                <th>Belongs To (Employee)</th>
                <th>Price ($)</th>
                <th>Condition</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    Fetching asset records from database...
                  </td>
                </tr>
              ) : assets.length > 0 ? (
                assets.map((asset) => (
                  <tr key={asset.asset_id}>
                    <td style={{ fontWeight: 700, color: '#818cf8' }}>{asset.asset_code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{asset.asset_name}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{asset.serial_number || '-'}</td>
                    
                    {/* Belongs To Column */}
                    <td>
                      {asset.assigned_to ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '6px', fontSize: '0.825rem', color: '#818cf8', fontWeight: 600 }}>
                          <UserIcon size={13} />
                          {asset.assigned_to.employee_name} ({asset.assigned_to.employee_code})
                        </div>
                      ) : null}
                      {asset.assigned_to ? (
                        <div style={{ fontSize: '0.72rem', marginTop: '0.25rem', color: 'var(--text-dim)' }}>
                          since {formatDate(asset.assigned_to.assigned_date)}
                          {asset.assigned_to.expected_return_date && (() => {
                            const due = dueInfo(asset.assigned_to.expected_return_date, 'Assigned');
                            return <> · <span style={{ color: DUE_COLORS[due.state], fontWeight: 700 }}>{due.text}</span></>;
                          })()}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Unassigned (In Storage)
                        </span>
                      )}
                    </td>

                    <td style={{ fontWeight: 600 }}>${asset.purchase_price != null ? Number(asset.purchase_price).toFixed(2) : '0.00'}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{asset.condition || 'Good'}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        {/* Assign Button if Available */}
                        {asset.status === 'Available' && (
                          <button
                            onClick={() => setAssignTarget(asset)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                            title="Assign to Employee"
                          >
                            <UserCheck size={13} /> Assign
                          </button>
                        )}

                        {/* Return Button if Assigned */}
                        {asset.status === 'Assigned' && (
                          <button
                            onClick={() => handleOpenReturnModal(asset)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                            title="Return Asset"
                          >
                            <UserX size={13} /> Return
                          </button>
                        )}

                        <button onClick={() => handleOpenEditModal(asset)} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem' }}><Edit size={14} /></button>
                        {canDeleteRecords(currentUserRole) && (
                          <button onClick={() => handleDelete(asset.asset_id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem' }}><Trash2 size={14} /></button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                    No assets found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Asset Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAsset ? "Edit Asset Record" : "Register New Asset"}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Asset Code *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.asset_code}
                onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Asset Name *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.asset_name}
                onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Asset Category *</label>
              <select
                required
                className="input-control"
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || undefined })}
              >
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Supplier *</label>
              <select
                required
                className="input-control"
                value={formData.supplier_id || ''}
                onChange={(e) => setFormData({ ...formData, supplier_id: parseInt(e.target.value) || undefined })}
              >
                {suppliers.map((sup) => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>
                    {sup.supplier_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Serial Number</label>
              <input
                type="text"
                className="input-control"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Purchase Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="input-control"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Condition</label>
              <select
                className="input-control"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Status</label>
              <select
                className="input-control"
                value={formData.status}
                disabled={formData.status === 'Assigned'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {formData.status === 'Assigned' && <option value="Assigned">Assigned</option>}
                <option value="Available">Available</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Damaged">Damaged</option>
                <option value="Lost">Lost</option>
                <option value="Retired">Retired</option>
                <option value="Disposed">Disposed</option>
              </select>
              {formData.status === 'Assigned' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                  Return this asset to change its status.
                </span>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Description</label>
            <textarea
              className="input-control"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Saving..." : editingAsset ? "Update Asset" : "Create Asset"}
            </button>
          </div>
        </form>
      </Modal>

      <AssignAssetDialog
        open={!!assignTarget}
        asset={assignTarget}
        employees={employees}
        onClose={() => setAssignTarget(null)}
        onSaved={fetchAssets}
      />
      <ReturnAssetDialog
        open={!!returnTarget}
        target={returnTarget}
        onClose={() => setReturnTarget(null)}
        onSaved={fetchAssets}
      />
    </div>
  );
};
