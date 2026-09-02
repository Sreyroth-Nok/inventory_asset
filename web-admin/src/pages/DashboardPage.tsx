import React, { useEffect, useState } from 'react';
import { Package, Boxes, AlertTriangle, Users, TrendingUp, RefreshCw, Plus } from 'lucide-react';
import { dashboardService, type DashboardStats } from '../services/dashboardService';
import { authService } from '../services/authService';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.ensureAuthenticated();
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch dashboard stats:", err);
      setError("Unable to connect to backend API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const kpiData = [
    { 
      title: 'Total Assets', 
      value: stats ? stats.asset_summary.total_assets.toString() : '...', 
      sub: `${stats?.asset_summary.available_assets || 0} Available`, 
      icon: Package, 
      color: '#6366f1', 
      glow: 'rgba(99, 102, 241, 0.25)' 
    },
    { 
      title: 'Inventory Items', 
      value: stats ? stats.inventory_summary.total_items.toString() : '...', 
      sub: `${stats?.inventory_summary.available_items || 0} In Stock`, 
      icon: Boxes, 
      color: '#06b6d4', 
      glow: 'rgba(6, 182, 212, 0.25)' 
    },
    { 
      title: 'Stock Alerts', 
      value: stats ? `${stats.inventory_summary.low_stock_items + stats.inventory_summary.out_of_stock_items} items` : '...', 
      sub: `${stats?.inventory_summary.low_stock_items || 0} Low Stock`, 
      icon: AlertTriangle, 
      color: '#f59e0b', 
      glow: 'rgba(245, 158, 11, 0.25)' 
    },
    { 
      title: 'Active Users', 
      value: stats ? stats.total_users.toString() : '...', 
      sub: `${stats?.total_employees || 0} Employees`, 
      icon: Users, 
      color: '#10b981', 
      glow: 'rgba(16, 185, 129, 0.25)' 
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {error && (
        <div style={{ padding: '0.875rem 1.25rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.875rem' }}>
          {error} Make sure FastAPI backend is running on <code>http://127.0.0.1:8000</code>.
        </div>
      )}

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {kpiData.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{item.title}</span>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: item.glow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={20} color={item.color} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#f8fafc' }}>
                  {loading ? '...' : item.value}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <TrendingUp size={13} />
                  {item.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Operations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Live Recent Transactions */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>Live Recent Activity & Transactions</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Real-time audit log fetched from backend API</p>
            </div>
            <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tx ID</th>
                  <th>Transaction Type</th>
                  <th>Quantity</th>
                  <th>Reference</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      Loading stats from API...
                    </td>
                  </tr>
                ) : stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                  stats.recent_transactions.map((tx: any) => (
                    <tr key={tx.transaction_id}>
                      <td style={{ fontWeight: 700, color: '#818cf8' }}>#{tx.transaction_id}</td>
                      <td>
                        <span className={`badge ${tx.transaction_type === 'Stock In' ? 'badge-active' : 'badge-info'}`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{tx.quantity}</td>
                      <td style={{ color: '#94a3b8' }}>{tx.reference || '-'}</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{tx.reason || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                      No recent transactions recorded in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>API Operations</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Plus size={18} /> Register New Asset
            </button>

            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Boxes size={18} color="#06b6d4" /> Record Stock Movement
            </button>

            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
              <Users size={18} color="#10b981" /> Add User Account
            </button>
          </div>

          <div style={{
            marginTop: 'auto',
            padding: '1rem',
            background: 'rgba(99, 102, 241, 0.08)',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <p style={{ fontSize: '0.8rem', color: '#818cf8', fontWeight: 600 }}>Backend Connection Status</p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Connected to <code>http://127.0.0.1:8000/api</code>. Database tables auto-synced.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
