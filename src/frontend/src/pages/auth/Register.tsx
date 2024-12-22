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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Checkbox,
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
import PasswordStrength from '@/components/auth/PasswordStrength';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      role: 'client',
      phone: '',
      termsAccepted: false,
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('validation.email'))
        .required(t('validation.required')),
      password: Yup.string()
        .min(8, t('validation.passwordMin'))
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          t('validation.passwordComplex')
        )
        .required(t('validation.required')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], t('validation.passwordMatch'))
        .required(t('validation.required')),
      name: Yup.string()
        .min(2, t('validation.nameMin'))
        .required(t('validation.required')),
      role: Yup.string()
        .oneOf(['client', 'escort'])
        .required(t('validation.required')),
      phone: Yup.string()
        .matches(/^\+?[1-9]\d{1,14}$/, t('validation.phone'))
        .required(t('validation.required')),
      termsAccepted: Yup.boolean()
        .oneOf([true], t('validation.terms'))
        .required(t('validation.required')),
    }),
    onSubmit: async (values) => {
      try {
        await register({
          email: values.email,
          password: values.password,
          name: values.name,
          role: values.role as 'client' | 'escort',
          phone: values.phone,
        });
        navigate('/auth/verify-email');
      } catch (error) {
        console.error('Registration error:', error);
      }
    },
  });

  const handleSocialRegister = (provider: string) => {
    // Implementierung für Social Registration
    console.log(`Register with ${provider}`);
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
              {t('auth.createAccount')}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {t('auth.registerSubtitle')}
            </Typography>
          </Box>

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label={t('auth.name')}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label={t('auth.email')}
                  type="email"
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
                  id="phone"
                  name="phone"
                  label={t('auth.phone')}
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">{t('auth.role')}</FormLabel>
                  <RadioGroup
                    row
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                  >
                    <FormControlLabel
                      value="client"
                      control={<Radio />}
                      label={t('auth.roleClient')}
                    />
                    <FormControlLabel
                      value="escort"
                      control={<Radio />}
                      label={t('auth.roleEscort')}
                    />
                  </RadioGroup>
                </FormControl>
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
                <PasswordStrength password={formik.values.password} />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label={t('auth.confirmPassword')}
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.confirmPassword &&
                    Boolean(formik.errors.confirmPassword)
                  }
                  helperText={
                    formik.touched.confirmPassword &&
                    formik.errors.confirmPassword
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="termsAccepted"
                      checked={formik.values.termsAccepted}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {t('auth.termsText')}{' '}
                      <Link
                        component={RouterLink}
                        to="/terms"
                        target="_blank"
                        rel="noopener"
                      >
                        {t('auth.termsLink')}
                      </Link>
                    </Typography>
                  }
                />
                {formik.touched.termsAccepted &&
                  formik.errors.termsAccepted && (
                    <Typography
                      color="error"
                      variant="caption"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      {formik.errors.termsAccepted}
                    </Typography>
                  )}
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                >
                  {isLoading
                    ? t('common.loading')
                    : t('auth.createAccount')}
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
                onClick={() => handleSocialRegister('google')}
              >
                Google
              </SocialButton>
            </Grid>
            <Grid item xs={12} sm={4}>
              <SocialButton
                fullWidth
                variant="outlined"
                startIcon={<FacebookIcon />}
                onClick={() => handleSocialRegister('facebook')}
              >
                Facebook
              </SocialButton>
            </Grid>
            <Grid item xs={12} sm={4}>
              <SocialButton
                fullWidth
                variant="outlined"
                startIcon={<AppleIcon />}
                onClick={() => handleSocialRegister('apple')}
              >
                Apple
              </SocialButton>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link
                component={RouterLink}
                to="/auth/login"
                sx={{
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                {t('auth.signIn')}
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </AuthLayout>
  );
};

export default Register;