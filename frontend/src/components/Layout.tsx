import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Chip,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  ViewKanban as BoardIcon,
  People as InspectorsIcon,
  BarChart as DashboardIcon,
  Logout as LogoutIcon,
  GroupWork as WorkloadIcon,
  AutoAwesome as AIFeaturesIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Kanban Board', path: '/', icon: <BoardIcon /> },
    { text: 'Inspector Management', path: '/inspectors', icon: <InspectorsIcon /> },
    { text: 'Dashboard Metrics', path: '/dashboard', icon: <DashboardIcon /> },
    { text: 'Workload Dashboard', path: '/workloads', icon: <WorkloadIcon /> },
    { text: 'Future AI Features', path: '/future-ai', icon: <AIFeaturesIcon sx={{ color: '#a855f7' }} /> },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#6366f1', fontFamily: 'Outfit, sans-serif' }}>
          QC SCHEDULER
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
      
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  color: isSelected ? '#818cf8' : '#94a3b8',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.04)',
                    color: '#f8fafc',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isSelected ? '#818cf8' : '#94a3b8',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: isSelected ? 600 : 500 }}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{
            py: 1,
            borderRadius: 2,
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5,
              backgroundColor: 'rgba(244, 63, 94, 0.05)',
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 700, fontFamily: 'Outfit' }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || 'QC Scheduler'}
          </Typography>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.username}
                </Typography>
                <Chip
                  label={user.role}
                  size="small"
                  color={user.role === 'Supervisor' ? 'primary' : 'secondary'}
                  sx={{
                    height: 18,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                />
              </Box>
              <Avatar
                sx={{
                  bgcolor: user.role === 'Supervisor' ? '#6366f1' : '#f43f5e',
                  fontWeight: 700,
                  width: 38,
                  height: 38,
                  fontSize: '0.95rem',
                  fontFamily: 'Outfit',
                }}
              >
                {user.username.substring(0, 2).toUpperCase()}
              </Avatar>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          pt: 10,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
