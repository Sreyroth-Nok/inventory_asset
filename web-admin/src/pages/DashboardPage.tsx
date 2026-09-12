import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  Users, 
  RefreshCw, 
  Plus, 
  ChevronDown, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { dashboardService, type DashboardStats } from '../services/dashboardService';
import { authService } from '../services/authService';

interface DashboardPageProps {
  onNavigate?: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.4rem', sm: '1.75rem' } }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Live asset & inventory operations metrics
          </Typography>
        </Box>

        <Button
          variant="outlined"
          onClick={fetchDashboardData}
          startIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          sx={{
            borderColor: 'divider',
            color: 'text.primary',
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          {error} Make sure FastAPI backend is running on <code>http://127.0.0.1:8000</code>.
        </Alert>
      )}

      {/* Row 1: Top 4 KPI Colored Tint Cards */}
      <Grid container spacing={2.5}>
        {/* Card 1: Total Assets */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'var(--kpi-red-bg)', borderColor: 'var(--kpi-red-border)', p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Total Assets</Typography>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#ff5252', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Package size={18} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {loading ? <CircularProgress size={20} /> : stats?.asset_summary.total_assets ?? 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#ff5252', fontWeight: 600, mt: 0.5, display: 'block' }}>
                {stats?.asset_summary.available_assets || 0} Available in stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 2: Inventory Items */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'var(--kpi-green-bg)', borderColor: 'var(--kpi-green-border)', p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Inventory Items</Typography>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Boxes size={18} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {loading ? <CircularProgress size={20} /> : stats?.inventory_summary.total_items ?? 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, mt: 0.5, display: 'block' }}>
                {stats?.inventory_summary.available_items || 0} In Stock units
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 3: Stock Alerts */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'var(--kpi-yellow-bg)', borderColor: 'var(--kpi-yellow-border)', p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Stock Alerts</Typography>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <AlertTriangle size={18} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {loading ? <CircularProgress size={20} /> : ((stats?.inventory_summary.low_stock_items || 0) + (stats?.inventory_summary.out_of_stock_items || 0))}
              </Typography>
              <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, mt: 0.5, display: 'block' }}>
                {stats?.inventory_summary.low_stock_items || 0} Low Stock items
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Card 4: Active Users */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'var(--kpi-blue-bg)', borderColor: 'var(--kpi-blue-border)', p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Active Users</Typography>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Users size={18} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                {loading ? <CircularProgress size={20} /> : stats?.total_users ?? 0}
              </Typography>
              <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 600, mt: 0.5, display: 'block' }}>
                {stats?.total_employees || 0} Employees registered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Charts Panel */}
      <Grid container spacing={2.5}>
        {/* Sales vs Purchase Bar Chart Container */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Sales vs Purchase</Typography>
              <Button size="small" variant="outlined" endIcon={<ChevronDown size={14} />} sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                This Year
              </Button>
            </Box>

            {/* SVG Bar Chart Visualization */}
            <Box sx={{ position: 'relative', width: '100%', height: 210, mt: 1 }}>
              {['80k', '60k', '40k', '20k', '0k'].map((label, i) => (
                <Box key={i} sx={{ position: 'absolute', top: `${(i / 4) * 160}px`, left: 0, right: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ width: 28, color: 'text.secondary', textAlign: 'right', fontSize: '0.7rem' }}>{label}</Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                </Box>
              ))}

              <Box sx={{ position: 'absolute', left: 40, right: 10, top: 10, bottom: 25, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
                {[
                  { date: '28 Jan', s: 55, p: 92 },
                  { date: '29 Jan', s: 92, p: 92 },
                  { date: '30 Jan', s: 68, p: 68 },
                  { date: '31 Jan', s: 92, p: 78 },
                  { date: '1 Feb', s: 74, p: 92 },
                  { date: '2 Feb', s: 84, p: 86 },
                  { date: '3 Feb', s: 78, p: 92 },
                  { date: '4 Feb', s: 68, p: 84 },
                  { date: '5 Feb', s: 78, p: 89 },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, height: '100%', justifyContent: 'flex-end' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 150 }}>
                      <Box sx={{ width: 12, height: `${item.s}%`, bgcolor: '#ffaa9b', borderRadius: '3px 3px 0 0' }} />
                      <Box sx={{ width: 12, height: `${item.p}%`, bgcolor: '#ff5252', borderRadius: '3px 3px 0 0' }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>
                      {item.date}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffaa9b' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Sales</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5252' }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>Purchase</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Overall Information Donut Chart Container */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, height: '100%', justifyContent: 'space-between' }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Overall Information</Typography>
                <Button size="small" variant="outlined" endIcon={<ChevronDown size={13} />} sx={{ borderColor: 'divider', color: 'text.secondary', fontSize: '0.75rem' }}>
                  Last 6 Months
                </Button>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Customers Overview
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 1 }}>
              <svg width="150" height="150" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border-color)" strokeWidth="14" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="14"
                  strokeDasharray="75 163" strokeDashoffset="0" transform="rotate(-90 50 50)" strokeLinecap="round" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="14"
                  strokeDasharray="110 128" strokeDashoffset="-85" transform="rotate(-90 50 50)" strokeLinecap="round" />
              </svg>
            </Box>

            <Grid container spacing={2} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>5.5K</Typography>
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600, display: 'block' }}>First Time</Typography>
                <Chip icon={<ArrowUpRight size={11} />} label="25%" size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.5 }} />
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>3.5K</Typography>
                <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, display: 'block' }}>Return</Typography>
                <Chip icon={<ArrowUpRight size={11} />} label="21%" size="small" color="warning" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.5 }} />
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Live Audit Log Transactions & Quick API Actions */}
      <Grid container spacing={2.5}>
        {/* Live Recent Transactions */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Live Recent Activity & Transactions</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Real-time audit log fetched from backend API</Typography>
              </Box>
              <Button size="small" variant="outlined" onClick={fetchDashboardData} startIcon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}>
                Refresh
              </Button>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Tx ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Transaction Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Loading stats from API...
                      </TableCell>
                    </TableRow>
                  ) : stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
                    stats.recent_transactions.map((tx: any) => (
                      <TableRow key={tx.transaction_id} hover>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>#{tx.transaction_id}</TableCell>
                        <TableCell>
                          <Chip 
                            label={tx.transaction_type} 
                            size="small" 
                            color={tx.transaction_type === 'Stock In' ? 'success' : 'info'} 
                            variant="outlined" 
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }} 
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{tx.quantity}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{tx.reference || '-'}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{tx.reason || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No recent transactions recorded in database.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Quick Operations Panel */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>API Operations</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="contained"
                onClick={() => onNavigate?.('assets')}
                startIcon={<Plus size={18} />}
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 1.2 }}
              >
                Register New Asset
              </Button>

              <Button
                variant="outlined"
                onClick={() => onNavigate?.('inventory')}
                startIcon={<Boxes size={18} color="#06b6d4" />}
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 1.2, borderColor: 'divider', color: 'text.primary' }}
              >
                Record Stock Movement
              </Button>

              <Button
                variant="outlined"
                onClick={() => onNavigate?.('users')}
                startIcon={<Users size={18} color="#10b981" />}
                fullWidth
                sx={{ justifyContent: 'flex-start', py: 1.2, borderColor: 'divider', color: 'text.primary' }}
              >
                Add User Account
              </Button>
            </Box>

            <Box sx={{ mt: 'auto', p: 2, bgcolor: 'var(--kpi-red-bg)', border: 1, borderColor: 'var(--kpi-red-border)', borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ color: '#ff5252', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Sparkles size={14} /> Backend Connection Status
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                Connected to <code>http://127.0.0.1:8000/api</code>. Database tables auto-synced.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
