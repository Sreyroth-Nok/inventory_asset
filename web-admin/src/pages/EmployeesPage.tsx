import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import type { Employee, EmployeeCreate, Department } from '../types/employee';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { authService } from '../services/authService';
import { Modal } from '../components/common/Modal';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const initialFormState: EmployeeCreate = {
    employee_code: '',
    employee_name: '',
    department_id: 1,
    email: '',
    phone: '',
    position: 'Staff',
    status: 'Active'
  };

  const [formData, setFormData] = useState<EmployeeCreate>(initialFormState);

  const fetchData = async () => {
    setLoading(true);
    try {
      await authService.ensureAuthenticated();
      const [empData, deptData] = await Promise.all([
        employeeService.getEmployees().catch(() => []),
        departmentService.getDepartments().catch(() => [])
      ]);
      setEmployees(empData);
      setDepartments(deptData);
    } catch (err) {
      console.error("Error fetching employee directory data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      ...initialFormState,
      department_id: departments.length > 0 ? departments[0].department_id : 1,
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
      department_id: emp.department_id || (departments.length > 0 ? departments[0].department_id : 1),
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
      fetchData();
    } catch (err: any) {
      console.error("Failed to save employee record:", err);
      const detail = err.response?.data?.detail;
      let msg = "Failed to save employee record.";
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
    if (confirm("Are you sure you want to delete this employee?")) {
      try {
        await employeeService.deleteEmployee(id);
        fetchData();
      } catch (err) {
        alert("Failed to delete employee.");
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={fetchData} className="btn btn-secondary">
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
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    Loading employee directory from database...
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>{emp.employee_code}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.employee_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{emp.position || 'Staff'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{emp.email || '-'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{emp.phone || '-'}</td>
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
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {formError && (
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.825rem' }}>
              {formError}
            </div>
          )}

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Employee Code *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Full Name *</label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Department</label>
              <select
                className="input-control"
                value={formData.department_id || ''}
                onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) || undefined })}
              >
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))
                ) : (
                  <option value={1}>General Department</option>
                )}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Position / Title</label>
              <input
                type="text"
                className="input-control"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Employment Status</label>
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
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Phone Number</label>
              <input
                type="text"
                className="input-control"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Email Address</label>
            <input
              type="email"
              className="input-control"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
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
