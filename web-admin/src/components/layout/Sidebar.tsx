import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Truck, 
  LogOut,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', label: 'Asset Management', icon: Package },
    { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'roles', label: 'Role Management', icon: ShieldCheck },
    { id: 'employees', label: 'Employees', icon: UserCheck },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
        }}>
          <Layers size={22} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
            Inventra<span style={{ color: '#06b6d4' }}>Admin</span>
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Asset & Inventory v2.0</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.875rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: 'none',
                background: isActive 
                  ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)' 
                  : 'transparent',
                color: isActive ? '#818cf8' : '#94a3b8',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                textAlign: 'left',
                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={19} color={isActive ? '#818cf8' : '#94a3b8'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info / Logout */}
      <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <button
          onClick={() => console.log('Logout clicked')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.625rem 1rem',
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#fca5a5',
            border: '1px solid rgba(244, 63, 94, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
