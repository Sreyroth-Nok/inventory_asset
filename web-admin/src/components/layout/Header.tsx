import React, { useEffect, useState } from 'react';
import { Search, Bell, Sparkles, Sun, Moon, Menu, User } from 'lucide-react';
import type { UserProfile } from '../../services/authService';

interface HeaderProps {
  title: string;
  user?: UserProfile | null;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, user, onToggleSidebar }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const getUserInitial = () => {
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          title="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {title}
          </h1>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Global Search */}
        <div className="header-search" style={{ position: 'relative', width: '240px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search assets, items..."
            className="input-control"
            style={{ paddingLeft: '2.5rem', height: '38px', fontSize: '0.825rem' }}
          />
        </div>

        {/* System Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.35rem 0.75rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          color: '#10b981',
          fontWeight: 600
        }}>
          <Sparkles size={13} />
          <span>API Connected</span>
        </div>

        {/* Theme Toggle Button (Light/Dark Mode) */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* Notification Bell */}
        <button style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          position: 'relative'
        }}>
          <Bell size={18} />
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#f43f5e'
          }} />
        </button>

        {/* User Profile Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.375rem 0.875rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#ffffff'
          }}>
            {getUserInitial()}
          </div>
          <div>
            <p style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
              {user?.username || 'User Profile'}
            </p>
            <p style={{ fontSize: '0.7rem', color: '#818cf8' }}>
              {typeof user?.role === 'string' ? user.role : user?.role?.role_name || 'System User'}
            </p>

          </div>
        </div>
      </div>
    </header>
  );
};
