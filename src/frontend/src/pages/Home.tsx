import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  useMediaQuery,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

import { useEscorts } from '@/hooks/useEscorts';
import { useLocations } from '@/hooks/useLocations';
import SearchBar from '@/components/search/SearchBar';
import LocationCard from '@/components/location/LocationCard';
import EscortCard from '@/components/escort/EscortCard';
import TestimonialCard from '@/components/testimonial/TestimonialCard';
import { theme } from '@/styles/theme';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { scrollY } = useScroll();

  // Parallax-Effekte
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const headerY = useTransform(scrollY, [0, 300], [0, 100]);

  // API-Daten
  const { escorts, isLoading: isLoadingEscorts } = useEscorts();
  const { locations, isLoading: isLoadingLocations } = useLocations();

  // Slider-Einstellungen
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: isMobile ? 1 : 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    pauseOnHover: true,
  };

  // Testimonials
  const testimonials = [
    {
      name: 'Michael K.',
      role: t('testimonials.client'),
      content: t('testimonials.review1'),
      rating: 5,
      image: '/testimonials/1.jpg',
    },
    {
      name: 'Sophie M.',
      role: t('testimonials.escort'),
      content: t('testimonials.review2'),
      rating: 5,
      image: '/testimonials/2.jpg',
    },
    {
      name: 'Thomas B.',
      role: t('testimonials.client'),
      content: t('testimonials.review3'),
      rating: 5,
      image: '/testimonials/3.jpg',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        component={motion.div}
        style={{ opacity: headerOpacity, y: headerY }}
        sx={{
          height: '100vh',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url(/images/hero-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    color: 'common.white',
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '4rem' },
                  }}
                >
                  {t('home.hero.title')}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: 'grey.300',
                    mb: 4,
                    fontSize: { xs: '1.5rem', md: '2rem' },
                  }}
                >
                  {t('home.hero.subtitle')}
                </Typography>
                <SearchBar />
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Featured Escorts Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{ mb: 4, textAlign: 'center' }}
          >
            {t('home.featured.title')}
          </Typography>
          {isLoadingEscorts ? (
            // Loading-Zustand
            <Grid container spacing={3}>
              {[1, 2, 3].map((i) => (
                <Grid key={i} item xs={12} sm={6} md={4}>
                  <Card sx={{ height: 400 }} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Slider {...sliderSettings}>
              {escorts?.slice(0, 6).map((escort) => (
                <Box key={escort.id} sx={{ p: 1 }}>
                  <EscortCard escort={escort} />
                </Box>
              ))}
            </Slider>
          )}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/escorts')}
            >
              {t('home.featured.viewAll')}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Popular Locations Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{ mb: 4, textAlign: 'center' }}
          >
            {t('home.locations.title')}
          </Typography>
          <Grid container spacing={3}>
            {locations?.slice(0, 6).map((location) => (
              <Grid key={location.id} item xs={12} sm={6} md={4}>
                <LocationCard location={location} />
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="outlined"
              size="large"
              endIcon={<LocationIcon />}
              onClick={() => navigate('/locations')}
            >
              {t('home.locations.viewAll')}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Why Choose Us Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{ mb: 6, textAlign: 'center' }}
          >
            {t('home.whyUs.title')}
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 3,
                }}
              >
                <VerifiedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 2 }}>
                  {t('home.whyUs.verified.title')}
                </Typography>
                <Typography color="text.secondary">
                  {t('home.whyUs.verified.description')}
                </Typography>
              </Box>
            </Grid>
            {/* Weitere "Why Choose Us" Items hier */}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{ mb: 6, textAlign: 'center' }}
          >
            {t('home.testimonials.title')}
          </Typography>
          <Slider {...sliderSettings}>
            {testimonials.map((testimonial, index) => (
              <Box key={index} sx={{ p: 1 }}>
                <TestimonialCard testimonial={testimonial} />
              </Box>
            ))}
          </Slider>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          bgcolor: 'primary.main',
          color: 'common.white',
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ mb: 3 }}>
              {t('home.cta.title')}
            </Typography>
            <Typography variant="h5" sx={{ mb: 4, color: 'grey.300' }}>
              {t('home.cta.subtitle')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'common.white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
              onClick={() => navigate('/register')}
            >
              {t('home.cta.button')}
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;