import React, { useState } from 'react';
import { Layers, Lock, User, Eye, EyeOff, LogIn, Key, Shield } from 'lucide-react';
import { authService, type UserProfile } from '../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.login({ username, password });
      const userProfile = await authService.getCurrentUser();
      onLoginSuccess(userProfile);
    } catch (err: any) {
      console.error("Login failed:", err);
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : "Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (usr: string, pwd: string) => {
    setUsername(usr);
    setPassword(pwd);
    setLoading(true);
    setError(null);
    try {
      await authService.login({ username: usr, password: pwd });
      const userProfile = await authService.getCurrentUser();
      onLoginSuccess(userProfile);
    } catch (err: any) {
      console.error("Quick login failed:", err);
      setError("Quick login failed. Make sure database is seeded.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f172a 60%, #020617 100%)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background glows */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '350px',
        height: '350px',
        background: 'rgba(99, 102, 241, 0.18)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '20%',
        width: '350px',
        height: '350px',
        background: 'rgba(6, 182, 212, 0.18)',
        filter: 'blur(100px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Main Glassmorphism Login Card */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        zIndex: 10
      }}>
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)',
            marginBottom: '1rem'
          }}>
            <Layers size={30} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.025em' }}>
            Inventra<span style={{ color: '#06b6d4' }}>Admin</span>
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            Asset & Inventory Management Portal
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              padding: '0.875rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              lineHeight: 1.4
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#64748b" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                placeholder="Enter your username"
                className="input-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                className="input-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.875rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              justifyContent: 'center',
              marginTop: '0.5rem',
              borderRadius: '12px'
            }}
          >
            {loading ? "Authenticating..." : (
              <>
                <LogIn size={18} /> Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Sign In Options */}
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textAlign: 'center' }}>
            DEMO QUICK LOGIN ACCOUNTS
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <button
              onClick={() => handleQuickLogin('admin', '123456')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem', justifyContent: 'center', flexDirection: 'column', gap: '0.2rem' }}
            >
              <Shield size={14} color="#818cf8" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin('manager01', '123456')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem', justifyContent: 'center', flexDirection: 'column', gap: '0.2rem' }}
            >
              <Key size={14} color="#06b6d4" />
              <span>Manager</span>
            </button>

            <button
              onClick={() => handleQuickLogin('staff01', '123456')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.4rem', justifyContent: 'center', flexDirection: 'column', gap: '0.2rem' }}
            >
              <User size={14} color="#10b981" />
              <span>Staff</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
