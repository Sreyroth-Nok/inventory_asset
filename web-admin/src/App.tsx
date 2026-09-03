import React, { useEffect, useState } from 'react';
import { LogOut, AlertTriangle, ShieldAlert } from 'lucide-react';
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

export const App: React.FC = () => {
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
        <div className="card animate-fade-in" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={32} color="#f87171" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>Access Restricted</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
            Your account role (<strong>{userRole}</strong>) does not have permission to view the <strong>{activeTab}</strong> page.
          </p>
          <button onClick={() => setActiveTab('dashboard')} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'assets': return <AssetsPage />;
      case 'inventory': return <InventoryPage />;
      case 'reports': return <ReportsPage />;
      case 'users': return <UsersPage />;
      case 'roles': return <RolesPage />;
      case 'employees': return <EmployeesPage />;
      case 'departments': return <DepartmentsPage />;
      case 'suppliers': return <SuppliersPage />;
      default: return <DashboardPage />;
    }
  };

  if (loadingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        color: '#818cf8',
        fontSize: '1rem',
        fontWeight: 600
      }}>
        Initializing Inventra Admin Portal...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onLogout={handleOpenLogoutModal}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header Bar */}
        <Header 
          title={getPageTitle()} 
          user={currentUser}
          onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        {/* Dynamic Page View Body */}
        <main className="page-body">
          {renderContent()}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Sign Out"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '12px'
          }}>
            <AlertTriangle size={28} color="#f43f5e" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fca5a5', margin: 0 }}>
                Are you sure you want to sign out?
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                You will be logged out of your session as <strong>{currentUser?.username || 'user'}</strong> and returned to the login screen.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="btn btn-danger"
              style={{ padding: '0.625rem 1.25rem', fontWeight: 700 }}
            >
              <LogOut size={16} /> Yes, Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
