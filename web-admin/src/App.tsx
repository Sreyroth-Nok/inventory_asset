import React, { useEffect, useState } from 'react';
import { LogOut, AlertTriangle, ShieldAlert } from 'lucide-react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import { CustomThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AssetsPage } from './pages/AssetsPage';
import { InventoryPage } from './pages/InventoryPage';
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { Modal } from './components/common/Modal';
import { authService, type UserProfile } from './services/authService';
import { canAccessTab } from './utils/rbac';

export const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  
  // Logout Confirmation Modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Check auth state and fetch logged-in user profile on load
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (err) {
          console.error("Session expired or invalid token:", err);
          authService.logout();
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    };

    initAuth();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleOpenLogoutModal = () => {
    setIsLogoutModalOpen(true);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const userRole = typeof currentUser?.role === 'string'
    ? currentUser.role
    : currentUser?.role?.role_name;

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Executive Dashboard';
      case 'assets': return 'Asset Inventory Management';
      case 'inventory': return 'Stock & Inventory Control';
      case 'reports': return 'Reports & Audit Analytics';
      case 'users': return 'System User Accounts';
      case 'roles': return 'Role & Access Control Management';
      case 'employees': return 'Employee Directory';
      case 'departments': return 'Department Management';
      case 'suppliers': return 'Supplier Management';
      default: return 'Dashboard';
    }
  };

  const renderContent = () => {
    // Check if the current user role has access to the requested tab
    if (userRole && !canAccessTab(userRole, activeTab)) {
      return (
        <Card sx={{ p: 4, textAlign: 'center', maxWidth: 480, mx: 'auto', my: 4 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={32} color="#f87171" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Access Restricted</Typography>
            <Typography variant="body2" color="text.secondary">
              Your account role (<strong>{userRole}</strong>) does not have permission to view the <strong>{activeTab}</strong> page.
            </Typography>
            <Button variant="contained" onClick={() => setActiveTab('dashboard')} sx={{ mt: 1 }}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardPage onNavigate={setActiveTab} />;
      case 'assets': return <AssetsPage />;
      case 'inventory': return <InventoryPage />;
      case 'reports': return <ReportsPage />;
      case 'users': return <UsersPage />;
      case 'roles': return <RolesPage />;
      case 'employees': return <EmployeesPage />;
      case 'departments': return <DepartmentsPage />;
      case 'suppliers': return <SuppliersPage />;
      default: return <DashboardPage onNavigate={setActiveTab} />;
    }
  };

  if (loadingAuth) {
    return (
      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'background.default',
        color: 'primary.main',
      }}>
        <CircularProgress color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Initializing Inventra Admin Portal...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Responsive Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onLogout={handleOpenLogoutModal}
      />

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header Bar */}
        <Header 
          title={getPageTitle()} 
          user={currentUser}
          onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        {/* Dynamic Page View Body */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          {renderContent()}
        </Box>
      </Box>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Sign Out"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            bgcolor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 3
          }}>
            <AlertTriangle size={28} color="#f43f5e" style={{ flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fca5a5' }}>
                Are you sure you want to sign out?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', lineHeight: 1.4 }}>
                You will be logged out of your session as <strong>{currentUser?.username || 'user'}</strong> and returned to the login screen.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setIsLogoutModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmLogout}
              startIcon={<LogOut size={16} />}
              sx={{ fontWeight: 700 }}
            >
              Yes, Sign Out
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export const App: React.FC = () => {
  return (
    <CustomThemeProvider>
      <AppContent />
    </CustomThemeProvider>
  );
};

export default App;
