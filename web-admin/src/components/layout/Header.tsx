import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import { Search, Bell, Settings, Sun, Moon, Menu } from 'lucide-react';
import { useColorMode } from '../../context/ThemeContext';
import type { UserProfile } from '../../services/authService';

interface HeaderProps {
  title: string;
  user?: UserProfile | null;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, user, onToggleSidebar }) => {
  const { mode, toggleTheme } = useColorMode();

  const getUserInitial = () => {
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 }, minHeight: 64 }}>
        {/* Left Section: Mobile Menu + Page Title + Search */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <IconButton
            onClick={onToggleSidebar}
            edge="start"
            aria-label="open drawer"
            sx={{ display: { md: 'none' }, color: 'text.primary' }}
          >
            <Menu size={20} />
          </IconButton>

          <Typography
            variant="h6"
            component="h1"
            noWrap
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              fontSize: { xs: '1rem', sm: '1.2rem' },
            }}
          >
            {title}
          </Typography>

          {/* Global Search Bar */}
          <Paper
            component="form"
            onSubmit={(e) => e.preventDefault()}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              width: { sm: 180, md: 240 },
              height: 36,
              px: 1.5,
              ml: 1,
              bgcolor: 'background.default',
              border: 1,
              borderColor: 'divider',
              borderRadius: '8px',
              boxShadow: 'none',
            }}
          >
            <Search size={15} color="var(--text-dim)" />
            <InputBase
              placeholder="Search..."
              sx={{ ml: 1, flex: 1, fontSize: '0.825rem', color: 'text.primary' }}
            />
          </Paper>
        </Box>

        {/* Right Section: Bell, Settings, Theme Toggle, Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {/* Notification Bell */}
          <Tooltip title="Notifications">
            <IconButton sx={{ color: 'text.secondary' }}>
              <Badge color="error" variant="dot" overlap="circular">
                <Bell size={18} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'inline-flex' } }}>
              <Settings size={18} />
            </IconButton>
          </Tooltip>

          {/* Light/Dark Mode Switcher */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
            <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
              {mode === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#ff5252" />}
            </IconButton>
          </Tooltip>

          {/* User Profile Avatar Capsule */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.5,
              px: 1.25,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: '10px',
              ml: 0.5,
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: 'primary.main',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {getUserInitial()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, color: 'text.primary' }}>
                {user?.username || 'User Profile'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, display: 'block' }}>
                {typeof user?.role === 'string' ? user.role : user?.role?.role_name || 'System User'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
