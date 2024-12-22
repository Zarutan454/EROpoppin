import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const footerSections = [
    {
      title: t('footer.company'),
      links: [
        { name: t('footer.about'), href: '/about' },
        { name: t('footer.careers'), href: '/careers' },
        { name: t('footer.press'), href: '/press' },
        { name: t('footer.blog'), href: '/blog' },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { name: t('footer.help'), href: '/help' },
        { name: t('footer.safety'), href: '/safety' },
        { name: t('footer.legal'), href: '/legal' },
        { name: t('footer.privacy'), href: '/privacy' },
      ],
    },
    {
      title: t('footer.business'),
      links: [
        { name: t('footer.advertising'), href: '/advertising' },
        { name: t('footer.marketing'), href: '/marketing' },
        { name: t('footer.api'), href: '/api' },
        { name: t('footer.partners'), href: '/partners' },
      ],
    },
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      icon: <FacebookIcon />,
      href: 'https://facebook.com',
    },
    {
      name: 'Instagram',
      icon: <InstagramIcon />,
      href: 'https://instagram.com',
    },
    {
      name: 'Twitter',
      icon: <TwitterIcon />,
      href: 'https://twitter.com',
    },
    {
      name: 'LinkedIn',
      icon: <LinkedInIcon />,
      href: 'https://linkedin.com',
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: isLandingPage ? 'transparent' : 'background.paper',
        color: isLandingPage ? 'common.white' : 'text.primary',
        py: { xs: 6, md: 10 },
        position: 'relative',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Logo und Beschreibung */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                VIP ESCORT
              </Typography>
              <Typography
                variant="body2"
                color={isLandingPage ? 'grey.300' : 'text.secondary'}
                sx={{ mb: 3 }}
              >
                {t('footer.description')}
              </Typography>
            </motion.div>

            {/* Social Media Links */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {socialLinks.map((social) => (
                <IconButton
                  key={social.name}
                  component={Link}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: isLandingPage ? 'common.white' : 'text.primary',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <Grid item xs={12} sm={6} md={2} key={section.title}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 2 }}
              >
                {section.title}
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  p: 0,
                  m: 0,
                }}
              >
                {section.links.map((link) => (
                  <Box
                    component="li"
                    key={link.name}
                    sx={{ mb: 1 }}
                  >
                    <Link
                      href={link.href}
                      color={isLandingPage ? 'grey.300' : 'text.secondary'}
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          color: 'primary.main',
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {link.name}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Copyright und zusätzliche Links */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="body2"
            color={isLandingPage ? 'grey.300' : 'text.secondary'}
          >
            © {new Date().getFullYear()} VIP Escort. {t('footer.rights')}
          </Typography>
          
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Link
              href="/terms"
              color={isLandingPage ? 'grey.300' : 'text.secondary'}
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {t('footer.terms')}
            </Link>
            <Link
              href="/privacy"
              color={isLandingPage ? 'grey.300' : 'text.secondary'}
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {t('footer.privacy')}
            </Link>
            <Link
              href="/cookies"
              color={isLandingPage ? 'grey.300' : 'text.secondary'}
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {t('footer.cookies')}
            </Link>
          </Box>
        </Box>
      </Container>

      {/* Scroll to Top Button */}
      {!isMobile && (
        <IconButton
          onClick={scrollToTop}
          sx={{
            position: 'absolute',
            right: 20,
            bottom: 20,
            bgcolor: 'primary.main',
            color: 'common.white',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default Footer;