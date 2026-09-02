import React from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="top-header">
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc' }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          System overview and management control panel
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Global Search */}
        <div style={{ position: 'relative', width: '260px' }}>
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
          color: '#34d399',
          fontWeight: 600
        }}>
          <Sparkles size={13} />
          <span>API Connected</span>
        </div>

        {/* Notification Bell */}
        <button style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
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
          background: 'rgba(30, 41, 59, 0.7)',
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
            A
          </div>
          <div>
            <p style={{ fontSize: '0.825rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.2 }}>Admin User</p>
            <p style={{ fontSize: '0.7rem', color: '#818cf8' }}>System Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};
