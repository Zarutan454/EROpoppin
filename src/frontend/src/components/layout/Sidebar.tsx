import { useMemo } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  useTheme,
  Badge,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Message as MessageIcon,
  Favorite as FavoriteIcon,
  AccountBalance as AccountIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  AdminPanelSettings as AdminIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useMessages } from '@/hooks/useMessages';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'permanent' | 'temporary';
}

const DRAWER_WIDTH = 240;

const Sidebar = ({ isOpen, onClose, variant }: SidebarProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadNotifications } = useNotifications();
  const { unreadMessages } = useMessages();

  const menuItems = useMemo(() => {
    const items = [
      {
        title: t('sidebar.dashboard'),
        path: '/dashboard',
        icon: <DashboardIcon />,
      },
      {
        title: t('sidebar.profile'),
        path: '/profile',
        icon: <PersonIcon />,
      },
      {
        title: t('sidebar.bookings'),
        path: '/bookings',
        icon: <EventIcon />,
      },
      {
        title: t('sidebar.messages'),
        path: '/messages',
        icon: <MessageIcon />,
        badge: unreadMessages,
      },
      {
        title: t('sidebar.favorites'),
        path: '/favorites',
        icon: <FavoriteIcon />,
      },
      {
        title: t('sidebar.notifications'),
        path: '/notifications',
        icon: <NotificationsIcon />,
        badge: unreadNotifications,
      },
      {
        title: t('sidebar.payments'),
        path: '/payments',
        icon: <AccountIcon />,
      },
      // Trenner
      null,
      {
        title: t('sidebar.settings'),
        path: '/settings',
        icon: <SettingsIcon />,
      },
      {
        title: t('sidebar.help'),
        path: '/help',
        icon: <HelpIcon />,
      },
    ];

    // Admin-Menü für Administratoren
    if (user?.role === 'admin') {
      items.splice(items.length - 2, 0, {
        title: t('sidebar.admin'),
        path: '/admin',
        icon: <AdminIcon />,
      });
    }

    return items;
  }, [t, user?.role, unreadMessages, unreadNotifications]);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Branding */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: 40, height: 40 }}
        />
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'Playfair Display',
            fontWeight: 700,
          }}
        >
          VIP ESCORT
        </Typography>
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map((item, index) => {
          if (item === null) {
            return <Divider key={index} sx={{ my: 2 }} />;
          }

          const isSelected = location.pathname === item.path;

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  if (variant === 'temporary') {
                    onClose();
                  }
                }}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isSelected ? 'inherit' : 'text.primary',
                    minWidth: 40,
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isSelected ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Benutzerinfo */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            component="img"
            src={user?.profileImage || '/default-avatar.png'}
            alt={user?.name}
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: DRAWER_WIDTH },
        flexShrink: { md: 0 },
      }}
    >
      {variant === 'temporary' ? (
        <Drawer
          variant="temporary"
          anchor="left"
          open={isOpen}
          onClose={onClose}
          ModalProps={{
            keepMounted: true, // Bessere mobile Performance
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          open={isOpen}
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;