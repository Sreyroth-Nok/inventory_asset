import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Trash2, Edit, Key, RefreshCw } from 'lucide-react';
import type { Role, RoleCreate } from '../types/role';
import { roleService } from '../services/roleService';
import { authService } from '../services/authService';
import { Modal } from '../components/common/Modal';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialFormState: RoleCreate = {
    role_name: '',
    description: ''
  };

  const [formData, setFormData] = useState<RoleCreate>(initialFormState);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      await authService.ensureAuthenticated();
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      role_name: role.role_name,
      description: role.description || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.role_id, formData);
      } else {
        await roleService.createRole(formData);
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      console.error("Failed to save role:", err);
      setFormError(err.response?.data?.detail || "Failed to save role. Ensure you have Admin permissions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      try {
        await roleService.deleteRole(id);
        fetchRoles();
      } catch (err) {
        alert("Failed to delete role.");
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={fetchRoles} className="btn btn-secondary">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Roles
        </button>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={18} /> Add New Role
        </button>
      </div>

      {/* Roles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
            Loading roles from database...
          </div>
        ) : roles.length > 0 ? (
          roles.map((role) => (
            <div key={role.role_id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ShieldCheck size={18} color="#818cf8" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{role.role_name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Role ID: #{role.role_id}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button onClick={() => handleOpenEditModal(role)} className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem' }}>
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(role.role_id)} className="btn btn-danger" style={{ padding: '0.35rem 0.5rem' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {role.description || 'No description provided.'}
              </p>

              <div style={{
                marginTop: 'auto',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#6366f1'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Key size={13} /> Active Access Controls
                </span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>Database Synced</span>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
            No roles stored in database.
          </div>
        )}
      </div>

      {/* Create / Edit Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? "Edit Role Configuration" : "Create New Role"}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Role Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Inventory Staff, Auditor, Manager"
              className="input-control"
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Description</label>
            <textarea
              className="input-control"
              rows={3}
              placeholder="Describe access rights and permissions for this role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
