import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import type { Employee, EmployeeCreate } from '../types/employee';
import { employeeService } from '../services/employeeService';
import { authService } from '../services/authService';
import { Modal } from '../components/common/Modal';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialFormState: EmployeeCreate = {
    employee_code: '',
    employee_name: '',
    email: '',
    phone: '',
    position: 'Staff',
    status: 'Active'
  };

  const [formData, setFormData] = useState<EmployeeCreate>(initialFormState);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      await authService.ensureAuthenticated();
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      ...initialFormState,
      employee_code: `EMP-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employee_code: emp.employee_code,
      employee_name: emp.employee_name,
      email: emp.email || '',
      phone: emp.phone || '',
      position: emp.position || 'Staff',
      status: emp.status || 'Active'
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.employee_id, formData);
      } else {
        await employeeService.createEmployee(formData);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      console.error("Failed to save employee record:", err);
      setFormError(err.response?.data?.detail || "Failed to save employee. Make sure you have proper permissions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await employeeService.deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert("Failed to delete employee.");
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={fetchEmployees} className="btn btn-secondary">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Employee Directory
        </button>

        <button onClick={handleOpenCreateModal} className="btn btn-primary">
          <Plus size={18} /> Add Employee
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Employee Name</th>
                <th>Position</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    Loading employee directory from database...
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{emp.employee_code}</td>
                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{emp.employee_name}</td>
                    <td style={{ color: '#cbd5e1' }}>{emp.position || 'Staff'}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.825rem' }}>{emp.email || '-'}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.825rem' }}>{emp.phone || '-'}</td>
                    <td>
                      <span className={`badge ${emp.status === 'Active' ? 'badge-active' : 'badge-danger'}`}>{emp.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenEditModal(emp)} className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem' }}><Edit size={14} /></button>
                        <button onClick={() => handleDelete(emp.employee_id)} className="btn btn-danger" style={{ padding: '0.35rem 0.6rem' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No employee records in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? "Edit Employee Record" : "Add New Employee"}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && (
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Employee Code *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Full Name *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Position / Title</label>
              <input
                type="text"
                className="input-control"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Employment Status</label>
              <select
                className="input-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Resigned">Resigned</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
              <input
                type="email"
                className="input-control"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
              <input
                type="text"
                className="input-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Saving..." : editingEmployee ? "Update Employee" : "Create Employee"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
