import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { InventoryItem, InventoryItemCreate } from '../types/inventory';
import type { Supplier } from '../types/supplier';
import { inventoryService } from '../services/inventoryService';
import { supplierService } from '../services/supplierService';
import { stockTransactionService } from '../services/stockTransactionService';
import { authService } from '../services/authService';
import { Modal } from '../components/common/Modal';
import { canDeleteRecords } from '../utils/rbac';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Stock In Modal State
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [selectedForStockIn, setSelectedForStockIn] = useState<InventoryItem | null>(null);
  const [stockInForm, setStockInForm] = useState({
    quantity: 10,
    reference: '',
    reason: 'Received from supplier',
    remarks: ''
  });

  // Stock Out Modal State
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [selectedForStockOut, setSelectedForStockOut] = useState<InventoryItem | null>(null);
  const [stockOutForm, setStockOutForm] = useState({
    quantity: 1,
    reference: '',
    reason: 'Issued to staff/department',
    remarks: ''
  });

  const initialFormState: InventoryItemCreate = {
    item_code: '',
    item_name: '',
    supplier_id: undefined,
    category: 'General',
    quantity: 0,
    minimum_stock: 5,
    unit: 'Piece',
    unit_price: 0,
    status: 'Available',
    description: ''
  };

  const [formData, setFormData] = useState<InventoryItemCreate>(initialFormState);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      await authService.ensureAuthenticated();
      const [data, supData, userProfile] = await Promise.all([
        inventoryService.getInventoryItems(searchTerm),
        supplierService.getSuppliers().catch(() => []),
        authService.getCurrentUser().catch(() => null)
      ]);
      setItems(data);
      setSuppliers(supData);

      const roleStr = typeof userProfile?.role === 'string'
        ? userProfile.role
        : userProfile?.role?.role_name || '';
      setCurrentUserRole(roleStr);
    } catch (err) {
      console.error("Error fetching inventory items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchTerm]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      ...initialFormState,
      supplier_id: suppliers.length > 0 ? suppliers[0].supplier_id : undefined,
      item_code: `INV-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      item_code: item.item_code,
      item_name: item.item_name,
      supplier_id: item.supplier_id || (suppliers.length > 0 ? suppliers[0].supplier_id : undefined),
      category: item.category || 'General',
      quantity: item.quantity,
      minimum_stock: item.minimum_stock,
      unit: item.unit || 'Piece',
      unit_price: item.unit_price || 0,
      status: item.status,
      description: item.description || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingItem) {
        await inventoryService.updateInventoryItem(editingItem.inventory_id, formData);
      } else {
        await inventoryService.createInventoryItem(formData);
      }
      setIsModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      console.error("Failed to save inventory item:", err);
      const detail = err.response?.data?.detail;
      let msg = "Failed to save inventory item. Please try again.";
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
    if (confirm("Are you sure you want to delete this inventory item?")) {
      try {
        await inventoryService.deleteInventoryItem(id);
        fetchInventory();
      } catch (err) {
        alert("Failed to delete inventory item.");
      }
    }
  };

  // Open Stock In Modal
  const handleOpenStockIn = (item: InventoryItem) => {
    setSelectedForStockIn(item);
    setStockInForm({
      quantity: 10,
      reference: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      reason: 'Stock replenishment received from vendor',
      remarks: ''
    });
    setFormError(null);
    setIsStockInModalOpen(true);
  };

  // Submit Stock In
  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForStockIn) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await stockTransactionService.performStockIn({
        inventory_id: selectedForStockIn.inventory_id,
        quantity: stockInForm.quantity,
        reference: stockInForm.reference,
        reason: stockInForm.reason,
        remarks: stockInForm.remarks
      });
      setIsStockInModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      console.error("Stock In failed:", err);
      setFormError(err.response?.data?.detail || "Failed to process Stock In.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Stock Out Modal
  const handleOpenStockOut = (item: InventoryItem) => {
    setSelectedForStockOut(item);
    setStockOutForm({
      quantity: 1,
      reference: `ISS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      reason: 'Issued for department usage',
      remarks: ''
    });
    setFormError(null);
    setIsStockOutModalOpen(true);
  };

  // Submit Stock Out
  const handleStockOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForStockOut) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await stockTransactionService.performStockOut({
        inventory_id: selectedForStockOut.inventory_id,
        quantity: stockOutForm.quantity,
        reference: stockOutForm.reference,
        reason: stockOutForm.reason,
        remarks: stockOutForm.remarks
      });
      setIsStockOutModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      console.error("Stock Out failed:", err);
      setFormError(err.response?.data?.detail || "Failed to process Stock Out.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available': return 'badge-available';
      case 'Low Stock': return 'badge-low-stock';
      case 'Out of Stock': return 'badge-out-of-stock';
      default: return 'badge-info';
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search item name or code..."
              className="input-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button onClick={fetchInventory} className="btn btn-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={18} /> Create Inventory Item
        </button>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Current Qty</th>
                <th>Min. Threshold</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    Loading stock records from API...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.inventory_id}>
                    <td style={{ fontWeight: 700, color: '#06b6d4' }}>{item.item_code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.item_name}</td>
                    <td>{item.category || 'General'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.unit || 'Piece'}</td>
                    <td style={{ fontWeight: 700, fontSize: '1rem', color: item.quantity <= item.minimum_stock ? '#e11d48' : 'var(--text-main)' }}>
                      {item.quantity}
                    </td>
                    <td style={{ color: 'var(--text-dim)' }}>{item.minimum_stock}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        
                        {/* Stock In Button */}
                        <button
                          onClick={() => handleOpenStockIn(item)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                          title="Stock In (+ Quantity)"
                        >
                          <ArrowUpRight size={13} /> Stock In
                        </button>

                        {/* Stock Out Button */}
                        <button
                          onClick={() => handleOpenStockOut(item)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                          title="Stock Out (- Quantity)"
                        >
                          <ArrowDownRight size={13} /> Stock Out
                        </button>

                        <button onClick={() => handleOpenEditModal(item)} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem' }}><Edit size={14} /></button>
                        {canDeleteRecords(currentUserRole) && (
                          <button onClick={() => handleDelete(item.inventory_id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem' }}><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
                    No inventory items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Inventory Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Inventory Item" : "Create Inventory Item"}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Item Code *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Item Name *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Category</label>
              <input
                type="text"
                placeholder="e.g. Office Supplies, IT Accessories"
                className="input-control"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Supplier *</label>
              <select
                required
                className="input-control"
                value={formData.supplier_id || ''}
                onChange={(e) => setFormData({ ...formData, supplier_id: parseInt(e.target.value) || undefined })}
              >
                {suppliers.length > 0 ? (
                  suppliers.map((sup) => (
                    <option key={sup.supplier_id} value={sup.supplier_id}>
                      {sup.supplier_name}
                    </option>
                  ))
                ) : (
                  <option value="">No suppliers available</option>
                )}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Quantity *</label>
              <input
                type="number"
                required
                min="0"
                className="input-control"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Minimum Stock Threshold</label>
              <input
                type="number"
                min="0"
                className="input-control"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Unit (e.g. Piece, Box, Pack)</label>
              <input
                type="text"
                className="input-control"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                className="input-control"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Status</label>
            <select
              className="input-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
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
              {submitting ? "Saving..." : editingItem ? "Update Item" : "Create Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock In Modal */}
      <Modal
        isOpen={isStockInModalOpen}
        onClose={() => setIsStockInModalOpen(false)}
        title={`Stock In (+ Recieve Stock): ${selectedForStockIn?.item_name} (${selectedForStockIn?.item_code})`}
      >
        <form onSubmit={handleStockInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.85rem', color: '#10b981' }}>
            Current Stock on Hand: <strong>{selectedForStockIn?.quantity} {selectedForStockIn?.unit || 'items'}</strong>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Quantity to Add *</label>
              <input
                type="number"
                required
                min="1"
                className="input-control"
                value={stockInForm.quantity}
                onChange={(e) => setStockInForm({ ...stockInForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Reference / PO Code</label>
              <input
                type="text"
                placeholder="e.g. PO-2026-005"
                className="input-control"
                value={stockInForm.reference}
                onChange={(e) => setStockInForm({ ...stockInForm, reference: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Reason for Addition</label>
            <input
              type="text"
              placeholder="e.g. Received shipment from ABC Supplier"
              className="input-control"
              value={stockInForm.reason}
              onChange={(e) => setStockInForm({ ...stockInForm, reason: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Remarks / Notes</label>
            <textarea
              className="input-control"
              rows={2}
              placeholder="e.g. Inspected and verified in warehouse..."
              value={stockInForm.remarks}
              onChange={(e) => setStockInForm({ ...stockInForm, remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsStockInModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting || stockInForm.quantity <= 0} className="btn btn-primary">
              {submitting ? "Processing..." : "Confirm Stock In (+)"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Out Modal */}
      <Modal
        isOpen={isStockOutModalOpen}
        onClose={() => setIsStockOutModalOpen(false)}
        title={`Stock Out (- Issue Stock): ${selectedForStockOut?.item_name} (${selectedForStockOut?.item_code})`}
      >
        <form onSubmit={handleStockOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.25)', fontSize: '0.85rem', color: '#f43f5e' }}>
            Current Available Stock: <strong>{selectedForStockOut?.quantity} {selectedForStockOut?.unit || 'items'}</strong>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Quantity to Remove *</label>
              <input
                type="number"
                required
                min="1"
                max={selectedForStockOut?.quantity || 1}
                className="input-control"
                value={stockOutForm.quantity}
                onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Reference / Issue Voucher</label>
              <input
                type="text"
                placeholder="e.g. ISS-2026-012"
                className="input-control"
                value={stockOutForm.reference}
                onChange={(e) => setStockOutForm({ ...stockOutForm, reference: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Reason for Issue / Removal</label>
            <input
              type="text"
              placeholder="e.g. Distributed to IT Department"
              className="input-control"
              value={stockOutForm.reason}
              onChange={(e) => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Remarks / Notes</label>
            <textarea
              className="input-control"
              rows={2}
              placeholder="e.g. Received by Dara..."
              value={stockOutForm.remarks}
              onChange={(e) => setStockOutForm({ ...stockOutForm, remarks: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsStockOutModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || stockOutForm.quantity <= 0 || (selectedForStockOut ? stockOutForm.quantity > selectedForStockOut.quantity : true)}
              className="btn btn-danger"
              style={{ padding: '0.625rem 1.25rem', fontWeight: 700 }}
            >
              {submitting ? "Processing..." : "Confirm Stock Out (-)"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
