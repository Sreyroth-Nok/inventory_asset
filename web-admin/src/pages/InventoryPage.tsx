import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Edit, RefreshCw } from 'lucide-react';
import type { InventoryItem, InventoryItemCreate } from '../types/inventory';
import { inventoryService } from '../services/inventoryService';
import { authService } from '../services/authService';
import { Modal } from '../components/common/Modal';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialFormState: InventoryItemCreate = {
    item_code: '',
    item_name: '',
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
      const data = await inventoryService.getInventoryItems(searchTerm);
      setItems(data);
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
      setFormError(err.response?.data?.detail || "Failed to save inventory item. Please try again.");
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
                  <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    Loading stock records from API...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.inventory_id}>
                    <td style={{ fontWeight: 700, color: '#06b6d4' }}>{item.item_code}</td>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{item.item_name}</td>
                    <td>{item.category || 'General'}</td>
                    <td style={{ color: '#94a3b8' }}>{item.unit || 'Piece'}</td>
                    <td style={{ fontWeight: 700, fontSize: '1rem', color: item.quantity <= item.minimum_stock ? '#fca5a5' : '#f8fafc' }}>
                      {item.quantity}
                    </td>
                    <td style={{ color: '#64748b' }}>{item.minimum_stock}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEditModal(item)} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem' }}><Edit size={14} /></button>
                        <button onClick={() => handleDelete(item.inventory_id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Item Code *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Item Name *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Quantity *</label>
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
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Minimum Stock Threshold</label>
              <input
                type="number"
                min="0"
                className="input-control"
                value={formData.minimum_stock}
                onChange={(e) => setFormData({ ...formData, minimum_stock: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Unit (e.g. Piece, Box, Pack)</label>
              <input
                type="text"
                className="input-control"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Unit Price ($)</label>
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
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Status</label>
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
            <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Description</label>
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
    </div>
  );
};
