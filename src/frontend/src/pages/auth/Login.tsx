import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
  Apple as AppleIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks/useAuth';
import SocialButton from '@/components/auth/SocialButton';
import AuthLayout from '@/components/auth/AuthLayout';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      remember: false,
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('validation.email'))
        .required(t('validation.required')),
      password: Yup.string()
        .min(8, t('validation.passwordMin'))
        .required(t('validation.required')),
    }),
    onSubmit: async (values) => {
      try {
        await login(values.email, values.password);
        navigate('/dashboard');
      } catch (error) {
        console.error('Login error:', error);
      }
    },
  });

  const handleSocialLogin = (provider: string) => {
    // Implementierung für Social Login
    console.log(`Login with ${provider}`);
  };

  return (
    <AuthLayout>
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 2,
                fontWeight: 700,
                fontFamily: 'Playfair Display',
              }}
            >
              {t('auth.welcomeBack')}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {t('auth.loginSubtitle')}
            </Typography>
          </Box>

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label={t('auth.email')}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label={t('auth.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Link
                    component={RouterLink}
                    to="/auth/forgot-password"
                    variant="body2"
                    sx={{ textDecoration: 'none' }}
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? t('common.loading') : t('auth.login')}
                </Button>
              </Grid>
            </Grid>
          </form>

          <Box sx={{ my: 3 }}>
            <Divider>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2 }}
              >
                {t('auth.orContinueWith')}
              </Typography>
            </Divider>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <SocialButton
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                onClick={() => handleSocialLogin('google')}
              >
                Google
              </SocialButton>
            </Grid>
            <Grid item xs={12} sm={4}>
              <SocialButton
                fullWidth
                variant="outlined"
                startIcon={<FacebookIcon />}
                onClick={() => handleSocialLogin('facebook')}
              >
                Facebook
              </SocialButton>
            </Grid>
            <Grid item xs={12} sm={4}>
              <SocialButton
                fullWidth
                variant="outlined"
                startIcon={<AppleIcon />}
                onClick={() => handleSocialLogin('apple')}
              >
                Apple
              </SocialButton>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth.noAccount')}{' '}
              <Link
                component={RouterLink}
                to="/auth/register"
                sx={{
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                {t('auth.signUp')}
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </AuthLayout>
  );
};

export default Login;