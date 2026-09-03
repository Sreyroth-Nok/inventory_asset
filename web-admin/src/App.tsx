import React, { useState } from 'react';
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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

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


  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header Bar */}
        <Header 
          title={getPageTitle()} 
          onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        {/* Dynamic Page View Body */}
        <main className="page-body">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
