import { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Mail as MailIcon,
  Favorite as FavoriteIcon,
  AccountCircle,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useMessages } from '@/hooks/useMessages';
import NotificationsPopover from '../notifications/NotificationsPopover';
import MessagesPopover from '../messages/MessagesPopover';
import { theme } from '@/styles/theme';

interface HeaderProps {
  onMenuClick: () => void;
  isLandingPage?: boolean;
}

const Header = ({ onMenuClick, isLandingPage = false }: HeaderProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadNotifications } = useNotifications();
  const { unreadMessages } = useMessages();

  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElLang, setAnchorElLang] = useState<null | HTMLElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenLangMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElLang(event.currentTarget);
  };

  const handleCloseLangMenu = () => {
    setAnchorElLang(null);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    handleCloseLangMenu();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      elevation={isLandingPage ? 0 : 1}
      sx={{
        backgroundColor: isLandingPage ? 'transparent' : 'background.paper',
        color: isLandingPage ? 'common.white' : 'text.primary',
      }}
    >
      <Container maxWidth={false}>
        <Toolbar disableGutters>
          {/* Logo und Menü-Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!isLandingPage && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={onMenuClick}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="h6"
                noWrap
                component="a"
                href="/"
                sx={{
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  letterSpacing: '.2rem',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                VIP ESCORT
              </Typography>
            </motion.div>
          </Box>

          {/* Hauptnavigation */}
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            {isLandingPage && (
              <Box
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  gap: 4,
                }}
              >
                <Button
                  color="inherit"
                  onClick={() => navigate('/escorts')}
                >
                  {t('navigation.escorts')}
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/locations')}
                >
                  {t('navigation.locations')}
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/services')}
                >
                  {t('navigation.services')}
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/vip')}
                >
                  {t('navigation.vip')}
                </Button>
              </Box>
            )}
          </Box>

          {/* Rechte Aktionen */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Sprachauswahl */}
            <Tooltip title={t('header.changeLanguage')}>
              <IconButton onClick={handleOpenLangMenu} color="inherit">
                <LanguageIcon />
              </IconButton>
            </Tooltip>

            {isAuthenticated ? (
              <>
                {/* Benachrichtigungen */}
                <Tooltip title={t('header.notifications')}>
                  <IconButton
                    onClick={() => setNotificationsOpen(true)}
                    color="inherit"
                  >
                    <Badge badgeContent={unreadNotifications} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Nachrichten */}
                <Tooltip title={t('header.messages')}>
                  <IconButton
                    onClick={() => setMessagesOpen(true)}
                    color="inherit"
                  >
                    <Badge badgeContent={unreadMessages} color="error">
                      <MailIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>

                {/* Favoriten */}
                <Tooltip title={t('header.favorites')}>
                  <IconButton
                    onClick={() => navigate('/favorites')}
                    color="inherit"
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Tooltip>

                {/* Benutzerprofil */}
                <Tooltip title={t('header.account')}>
                  <IconButton onClick={handleOpenUserMenu}>
                    {user?.profileImage ? (
                      <Avatar
                        alt={user.name}
                        src={user.profileImage}
                        sx={{ width: 32, height: 32 }}
                      />
                    ) : (
                      <AccountCircle />
                    )}
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/auth/login')}
                  sx={{
                    color: isLandingPage ? 'common.white' : 'primary.main',
                    borderColor: isLandingPage ? 'common.white' : 'primary.main',
                  }}
                >
                  {t('auth.login')}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/auth/register')}
                  sx={{
                    bgcolor: isLandingPage ? 'common.white' : 'primary.main',
                    color: isLandingPage ? 'primary.main' : 'common.white',
                    '&:hover': {
                      bgcolor: isLandingPage ? 'grey.100' : 'primary.dark',
                    },
                  }}
                >
                  {t('auth.register')}
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* Benutzermenü */}
      <Menu
        sx={{ mt: '45px' }}
        id="menu-appbar"
        anchorEl={anchorElUser}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
      >
        <MenuItem onClick={() => {
          handleCloseUserMenu();
          navigate('/profile');
        }}>
          <Typography textAlign="center">{t('header.profile')}</Typography>
        </MenuItem>
        <MenuItem onClick={() => {
          handleCloseUserMenu();
          navigate('/settings');
        }}>
          <Typography textAlign="center">{t('header.settings')}</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography textAlign="center">{t('auth.logout')}</Typography>
        </MenuItem>
      </Menu>

      {/* Sprachmenü */}
      <Menu
        sx={{ mt: '45px' }}
        id="menu-language"
        anchorEl={anchorElLang}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorElLang)}
        onClose={handleCloseLangMenu}
      >
        <MenuItem onClick={() => handleLanguageChange('de')}>
          <Typography textAlign="center">Deutsch</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('en')}>
          <Typography textAlign="center">English</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('es')}>
          <Typography textAlign="center">Español</Typography>
        </MenuItem>
      </Menu>

      {/* Benachrichtigungen Popover */}
      <NotificationsPopover
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Nachrichten Popover */}
      <MessagesPopover
        open={messagesOpen}
        onClose={() => setMessagesOpen(false)}
      />
    </AppBar>
  );
};

export default Header;