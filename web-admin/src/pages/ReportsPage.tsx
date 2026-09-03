import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  RefreshCw, 
  Calendar, 
  Package, 
  Boxes, 
  Building2, 
  AlertTriangle,
  Search
} from 'lucide-react';
import { 
  reportsService, 
  type AssetHistoryReportItem, 
  type StockMovementReportItem, 
  type DepartmentSummaryReportItem, 
  type InventoryStatusReportItem 
} from '../services/reportsService';
import { authService } from '../services/authService';
import { exportToCSV } from '../utils/csvExporter';

export const ReportsPage: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState<'asset-history' | 'stock-movements' | 'department-summary' | 'inventory-status'>('asset-history');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('');

  // Report Data Sets
  const [assetHistory, setAssetHistory] = useState<AssetHistoryReportItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovementReportItem[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummaryReportItem[]>([]);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatusReportItem[]>([]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      await authService.ensureAuthenticated();

      if (activeReportTab === 'asset-history') {
        const data = await reportsService.getAssetHistory({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          status_filter: statusFilter || undefined
        });
        setAssetHistory(data);
      } else if (activeReportTab === 'stock-movements') {
        const data = await reportsService.getStockMovements({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          transaction_type: txTypeFilter || undefined
        });
        setStockMovements(data);
      } else if (activeReportTab === 'department-summary') {
        const data = await reportsService.getDepartmentSummary();
        setDepartmentSummary(data);
      } else if (activeReportTab === 'inventory-status') {
        const data = await reportsService.getInventoryStatus({
          status_filter: statusFilter || undefined
        });
        setInventoryStatus(data);
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReportTab, startDate, endDate, statusFilter, txTypeFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (activeReportTab === 'asset-history') {
      const headers = [
        { label: 'Assignment ID', key: 'assignment_id' },
        { label: 'Asset Code', key: 'asset_code' },
        { label: 'Asset Name', key: 'asset_name' },
        { label: 'Employee Code', key: 'employee_code' },
        { label: 'Employee Name', key: 'employee_name' },
        { label: 'Department', key: 'department_name' },
        { label: 'Assigned By', key: 'assigned_by' },
        { label: 'Assigned Date', key: 'assigned_date' },
        { label: 'Condition on Assign', key: 'condition_on_assignment' },
        { label: 'Returned Date', key: 'returned_date' },
        { label: 'Condition on Return', key: 'condition_on_return' },
        { label: 'Status', key: 'status' },
        { label: 'Remarks', key: 'remarks' }
      ];
      exportToCSV('Asset_Handover_History_Report', headers, filteredAssetHistory);
    } else if (activeReportTab === 'stock-movements') {
      const headers = [
        { label: 'Transaction ID', key: 'transaction_id' },
        { label: 'Item Code', key: 'item_code' },
        { label: 'Item Name', key: 'item_name' },
        { label: 'Unit', key: 'unit' },
        { label: 'Type', key: 'transaction_type' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Reference', key: 'reference' },
        { label: 'Reason', key: 'reason' },
        { label: 'Recorded By', key: 'recorded_by' },
        { label: 'Date', key: 'created_at' }
      ];
      exportToCSV('Stock_Movements_Audit_Report', headers, filteredStockMovements);
    } else if (activeReportTab === 'department-summary') {
      const headers = [
        { label: 'Dept ID', key: 'department_id' },
        { label: 'Department Name', key: 'department_name' },
        { label: 'Status', key: 'status' },
        { label: 'Employee Count', key: 'employee_count' },
        { label: 'Assigned Assets', key: 'assigned_assets_count' },
        { label: 'Total Asset Value ($)', key: 'total_asset_value' }
      ];
      exportToCSV('Department_Asset_Distribution_Report', headers, filteredDepartmentSummary);
    } else if (activeReportTab === 'inventory-status') {
      const headers = [
        { label: 'Item Code', key: 'item_code' },
        { label: 'Item Name', key: 'item_name' },
        { label: 'Category', key: 'category' },
        { label: 'Unit', key: 'unit' },
        { label: 'Stock On Hand', key: 'quantity' },
        { label: 'Minimum Stock', key: 'minimum_stock' },
        { label: 'Status', key: 'status' },
        { label: 'Supplier', key: 'supplier_name' }
      ];
      exportToCSV('Inventory_Status_Report', headers, filteredInventoryStatus);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Filtering by search term
  const filteredAssetHistory = assetHistory.filter(item => 
    item.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStockMovements = stockMovements.filter(item =>
    item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDepartmentSummary = departmentSummary.filter(item =>
    item.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInventoryStatus = inventoryStatus.filter(item =>
    item.item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', padding: '0.35rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={() => setActiveReportTab('asset-history')}
            className={`btn ${activeReportTab === 'asset-history' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.875rem' }}
          >
            <Package size={15} /> Asset Handover
          </button>
          <button
            onClick={() => setActiveReportTab('stock-movements')}
            className={`btn ${activeReportTab === 'stock-movements' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.875rem' }}
          >
            <Boxes size={15} /> Stock Movements
          </button>
          <button
            onClick={() => setActiveReportTab('department-summary')}
            className={`btn ${activeReportTab === 'department-summary' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.875rem' }}
          >
            <Building2 size={15} /> Dept Distribution
          </button>
          <button
            onClick={() => setActiveReportTab('inventory-status')}
            className={`btn ${activeReportTab === 'inventory-status' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.875rem' }}
          >
            <AlertTriangle size={15} /> Inventory Health
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <Download size={16} /> Export CSV
          </button>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Search Box */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search report records..."
              className="input-control"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.25rem', fontSize: '0.825rem' }}
            />
          </div>

          {/* Date Pickers for History / Movements */}
          {(activeReportTab === 'asset-history' || activeReportTab === 'stock-movements') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From:</span>
              <input
                type="date"
                className="input-control"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To:</span>
              <input
                type="date"
                className="input-control"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}

          {/* Status Dropdowns */}
          {activeReportTab === 'asset-history' && (
            <select
              className="input-control"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Currently Assigned</option>
              <option value="Returned">Returned</option>
            </select>
          )}

          {activeReportTab === 'stock-movements' && (
            <select
              className="input-control"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              value={txTypeFilter}
              onChange={(e) => setTxTypeFilter(e.target.value)}
            >
              <option value="">All Movement Types</option>
              <option value="Stock In">Stock In (+)</option>
              <option value="Stock Out">Stock Out (-)</option>
            </select>
          )}

          {activeReportTab === 'inventory-status' && (
            <select
              className="input-control"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Stock Conditions</option>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          )}
        </div>

        <button onClick={fetchReportData} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Dataset
        </button>
      </div>

      {/* Report Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Report Type</span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#818cf8' }}>
            {activeReportTab === 'asset-history' && 'Asset Handover History'}
            {activeReportTab === 'stock-movements' && 'Stock Movement Audit Log'}
            {activeReportTab === 'department-summary' && 'Department Asset Allocation'}
            {activeReportTab === 'inventory-status' && 'Inventory Health & Reorder'}
          </span>
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Total Records</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {loading ? '...' : 
              activeReportTab === 'asset-history' ? filteredAssetHistory.length :
              activeReportTab === 'stock-movements' ? filteredStockMovements.length :
              activeReportTab === 'department-summary' ? filteredDepartmentSummary.length :
              filteredInventoryStatus.length
            }
          </span>
        </div>

        {activeReportTab === 'department-summary' && (
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Total Allocated Asset Value</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
              ${departmentSummary.reduce((acc, curr) => acc + curr.total_asset_value, 0).toFixed(2)}
            </span>
          </div>
        )}

        {activeReportTab === 'inventory-status' && (
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Items Requiring Reorder</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b' }}>
              {inventoryStatus.filter(i => i.needs_reorder).length} items
            </span>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="card">
        <div className="table-container">
          
          {/* TAB 1: Asset History */}
          {activeReportTab === 'asset-history' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assign ID</th>
                  <th>Asset Code</th>
                  <th>Asset Name</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Assign Date</th>
                  <th>Condition (Assign)</th>
                  <th>Return Date</th>
                  <th>Condition (Return)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading asset history...</td></tr>
                ) : filteredAssetHistory.length > 0 ? (
                  filteredAssetHistory.map((item) => (
                    <tr key={item.assignment_id}>
                      <td style={{ fontWeight: 700, color: '#818cf8' }}>#{item.assignment_id}</td>
                      <td style={{ fontWeight: 600 }}>{item.asset_code}</td>
                      <td>{item.asset_name}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.employee_name} ({item.employee_code})</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.department_name}</td>
                      <td>{item.assigned_date}</td>
                      <td style={{ fontSize: '0.8rem' }}>{item.condition_on_assignment}</td>
                      <td>{item.returned_date || '-'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{item.condition_on_return || '-'}</td>
                      <td>
                        <span className={`badge ${item.status === 'Assigned' ? 'badge-assigned' : 'badge-available'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No assignment records found.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: Stock Movements */}
          {activeReportTab === 'stock-movements' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Reference</th>
                  <th>Reason</th>
                  <th>Recorded By</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading stock audit transactions...</td></tr>
                ) : filteredStockMovements.length > 0 ? (
                  filteredStockMovements.map((item) => (
                    <tr key={item.transaction_id}>
                      <td style={{ fontWeight: 700, color: '#818cf8' }}>#{item.transaction_id}</td>
                      <td style={{ fontWeight: 600 }}>{item.item_code}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.item_name}</td>
                      <td>
                        <span className={`badge ${item.transaction_type === 'Stock In' ? 'badge-active' : 'badge-info'}`}>
                          {item.transaction_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{item.transaction_type === 'Stock In' ? `+${item.quantity}` : `-${item.quantity}`} {item.unit}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.reference}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{item.reason}</td>
                      <td style={{ fontSize: '0.825rem' }}>{item.recorded_by}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.created_at}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No stock transactions found.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: Department Summary */}
          {activeReportTab === 'department-summary' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dept ID</th>
                  <th>Department Name</th>
                  <th>Status</th>
                  <th>Employee Count</th>
                  <th>Assigned Assets Count</th>
                  <th>Total Allocated Asset Value ($)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading department summary...</td></tr>
                ) : filteredDepartmentSummary.length > 0 ? (
                  filteredDepartmentSummary.map((item) => (
                    <tr key={item.department_id}>
                      <td style={{ fontWeight: 700, color: '#818cf8' }}>#{item.department_id}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.department_name}</td>
                      <td>
                        <span className={`badge ${item.status === 'Active' ? 'badge-active' : 'badge-danger'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.employee_count} employees</td>
                      <td style={{ fontWeight: 600, color: '#818cf8' }}>{item.assigned_assets_count} items</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>${item.total_asset_value.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No department records found.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 4: Inventory Status */}
          {activeReportTab === 'inventory-status' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Stock On Hand</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading inventory health status...</td></tr>
                ) : filteredInventoryStatus.length > 0 ? (
                  filteredInventoryStatus.map((item) => (
                    <tr key={item.inventory_id}>
                      <td style={{ fontWeight: 700, color: '#06b6d4' }}>{item.item_code}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.item_name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{item.category}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{item.supplier_name}</td>
                      <td style={{ fontWeight: 700 }}>{item.quantity} {item.unit}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.minimum_stock} {item.unit}</td>
                      <td>
                        <span className={`badge ${item.status === 'Available' ? 'badge-available' : item.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.needs_reorder ? (
                          <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '6px', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 600 }}>
                            ⚠️ Needs Reorder
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ Stock Healthy</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No inventory items found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
