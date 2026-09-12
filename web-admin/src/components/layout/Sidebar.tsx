import React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  FileText, 
  Users, 
  ShieldCheck, 
  UserCheck, 
  Building2, 
  Truck, 
  LogOut,
  X
} from 'lucide-react';
import { canAccessTab } from '../../utils/rbac';

const DRAWER_WIDTH = 260;

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole?: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  userRole, 
  mobileOpen, 
  onCloseMobile, 
  onLogout 
}) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const menuSections: MenuSection[] = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'assets', label: 'Asset Management', icon: Package },
        { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
        { id: 'reports', label: 'Reports & Analytics', icon: FileText },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'users', label: 'User Accounts', icon: Users },
        { id: 'roles', label: 'Role Management', icon: ShieldCheck },
        { id: 'employees', label: 'Employees', icon: UserCheck },
      ]
    },
    {
      title: 'ORGANIZATION',
      items: [
        { id: 'departments', label: 'Departments', icon: Building2 },
        { id: 'suppliers', label: 'Suppliers', icon: Truck },
      ]
    }
  ];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      {/* Brand Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, px: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 38,
              height: 38,
              bgcolor: 'primary.main',
              fontWeight: 800,
              fontSize: '1rem',
              borderRadius: '10px',
              boxShadow: '0 4px 10px rgba(255, 82, 82, 0.3)',
            }}
          >
            IA
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1, color: 'text.primary' }}>
              Inventra<Box component="span" sx={{ color: 'primary.main' }}>Admin</Box>
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.05em' }}>
              Asset & Inventory v2.0
            </Typography>
          </Box>
        </Box>

        {!isDesktop && onCloseMobile && (
          <IconButton onClick={onCloseMobile} size="small">
            <X size={18} />
          </IconButton>
        )}
      </Box>

      {/* Navigation Sections */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter(item => canAccessTab(userRole, item.id));
          if (visibleItems.length === 0) return null;

          return (
            <List
              key={idx}
              disablePadding
              sx={{ mb: 2 }}
              subheader={
                <ListSubheader
                  disableSticky
                  sx={{
                    bgcolor: 'transparent',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: 'text.secondary',
                    letterSpacing: '0.08em',
                    lineHeight: '24px',
                    px: 1,
                    mb: 0.5,
                  }}
                >
                  {section.title}
                </ListSubheader>
              }
            >
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => handleSelectTab(item.id)}
                      sx={{
                        borderRadius: '10px',
                        py: 1,
                        px: 1.5,
                        '&.Mui-selected': {
                          bgcolor: 'action.selected',
                          color: 'primary.main',
                          fontWeight: 700,
                          '& .MuiListItemIcon-root': {
                            color: 'primary.main',
                          },
                          '&:hover': {
                            bgcolor: 'action.selected',
                          },
                        },
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'text.secondary' }}>
                        <Icon size={18} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 500 }}>
                            {item.label}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          );
        })}
      </Box>

      {/* Footer Info / Logout Button */}
      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={onLogout}
          startIcon={<LogOut size={16} />}
          sx={{
            py: 1,
            borderRadius: '10px',
            bgcolor: 'rgba(244, 63, 94, 0.1)',
            borderColor: 'rgba(244, 63, 94, 0.25)',
            color: '#fca5a5',
            '&:hover': {
              bgcolor: 'rgba(244, 63, 94, 0.2)',
              borderColor: 'rgba(244, 63, 94, 0.4)',
            },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Temporary Drawer */}
      {!isDesktop ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onCloseMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        /* Desktop Permanent Drawer */
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
};
