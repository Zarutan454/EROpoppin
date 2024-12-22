import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';
import CheckIcon from '@mui/icons-material/Check';
import { supportedLanguages } from '../../i18n';

export const LanguageSelector: React.FC = () => {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    handleClose();
  };

  const currentLanguage = supportedLanguages.find(
    lang => lang.code === i18n.language
  ) || supportedLanguages[0];

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        sx={{
          color: theme.palette.text.primary,
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          },
        }}
      >
        <Typography
          component="span"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {currentLanguage.flag} {currentLanguage.name}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 180,
            maxHeight: 'calc(100% - 96px)',
            borderRadius: 1,
            boxShadow: theme.shadows[3],
          },
        }}
      >
        {supportedLanguages.map(language => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            selected={i18n.language === language.code}
            sx={{
              py: 1,
              px: 2,
              '&.Mui-selected': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Typography fontSize="20px">{language.flag}</Typography>
            </ListItemIcon>
            <ListItemText primary={language.name} />
            {i18n.language === language.code && (
              <CheckIcon sx={{ color: theme.palette.primary.main, ml: 1 }} />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};