import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  FormHelperText,
  Typography,
  Chip,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'react-i18next';
import { subYears } from 'date-fns';

import { EscortProfile } from '@/types/profile';
import { languageOptions, buildOptions, eyeColorOptions, hairColorOptions } from '@/utils/options';

interface BasicInfoFormProps {
  profile: EscortProfile;
  onSave: (data: Partial<EscortProfile>) => Promise<void>;
  isSaving: boolean;
}

const BasicInfoForm = ({ profile, onSave, isSaving }: BasicInfoFormProps) => {
  const { t } = useTranslation();

  const validationSchema = Yup.object({
    name: Yup.string()
      .required(t('validation.required'))
      .min(2, t('validation.nameMin')),
    tagline: Yup.string().max(100, t('validation.taglineMax')),
    description: Yup.string()
      .required(t('validation.required'))
      .min(100, t('validation.descriptionMin'))
      .max(2000, t('validation.descriptionMax')),
    age: Yup.number()
      .required(t('validation.required'))
      .min(18, t('validation.ageMin'))
      .max(99, t('validation.ageMax')),
    gender: Yup.string().required(t('validation.required')),
    orientation: Yup.string().required(t('validation.required')),
    ethnicity: Yup.string(),
    nationality: Yup.string(),
    languages: Yup.array()
      .of(
        Yup.object({
          language: Yup.string().required(),
          level: Yup.string().required(),
        })
      )
      .min(1, t('validation.languagesMin')),
    physicalAttributes: Yup.object({
      height: Yup.number()
        .min(140, t('validation.heightMin'))
        .max(220, t('validation.heightMax')),
      weight: Yup.number()
        .min(40, t('validation.weightMin'))
        .max(150, t('validation.weightMax')),
      measurements: Yup.string().matches(
        /^\d{2,3}-\d{2,3}-\d{2,3}$/,
        t('validation.measurements')
      ),
      eyeColor: Yup.string(),
      hairColor: Yup.string(),
      build: Yup.string(),
    }),
  });

  const formik = useFormik({
    initialValues: {
      name: profile.name || '',
      tagline: profile.tagline || '',
      description: profile.description || '',
      age: profile.age || 18,
      gender: profile.gender || '',
      orientation: profile.orientation || '',
      ethnicity: profile.ethnicity || '',
      nationality: profile.nationality || '',
      languages: profile.languages || [],
      physicalAttributes: {
        height: profile.physicalAttributes?.height || '',
        weight: profile.physicalAttributes?.weight || '',
        measurements: profile.physicalAttributes?.measurements || '',
        eyeColor: profile.physicalAttributes?.eyeColor || '',
        hairColor: profile.physicalAttributes?.hairColor || '',
        build: profile.physicalAttributes?.build || '',
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await onSave(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {t('profile.basicInfo')}
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="name"
            name="name"
            label={t('profile.name')}
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            id="tagline"
            name="tagline"
            label={t('profile.tagline')}
            value={formik.values.tagline}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.tagline && Boolean(formik.errors.tagline)}
            helperText={formik.touched.tagline && formik.errors.tagline}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            id="description"
            name="description"
            label={t('profile.description')}
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.description && Boolean(formik.errors.description)}
            helperText={formik.touched.description && formik.errors.description}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            id="age"
            name="age"
            label={t('profile.age')}
            type="number"
            value={formik.values.age}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.age && Boolean(formik.errors.age)}
            helperText={formik.touched.age && formik.errors.age}
            InputProps={{
              inputProps: { min: 18, max: 99 },
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            id="gender"
            name="gender"
            label={t('profile.gender')}
            value={formik.values.gender}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.gender && Boolean(formik.errors.gender)}
            helperText={formik.touched.gender && formik.errors.gender}
          >
            <MenuItem value="female">{t('gender.female')}</MenuItem>
            <MenuItem value="male">{t('gender.male')}</MenuItem>
            <MenuItem value="trans">{t('gender.trans')}</MenuItem>
            <MenuItem value="nonBinary">{t('gender.nonBinary')}</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            id="orientation"
            name="orientation"
            label={t('profile.orientation')}
            value={formik.values.orientation}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.orientation && Boolean(formik.errors.orientation)}
            helperText={formik.touched.orientation && formik.errors.orientation}
          >
            <MenuItem value="straight">{t('orientation.straight')}</MenuItem>
            <MenuItem value="gay">{t('orientation.gay')}</MenuItem>
            <MenuItem value="lesbian">{t('orientation.lesbian')}</MenuItem>
            <MenuItem value="bisexual">{t('orientation.bisexual')}</MenuItem>
            <MenuItem value="pansexual">{t('orientation.pansexual')}</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            {t('profile.physical')}
          </Typography>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            id="physicalAttributes.height"
            name="physicalAttributes.height"
            label={t('profile.height')}
            type="number"
            value={formik.values.physicalAttributes.height}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.physicalAttributes?.height &&
              Boolean(formik.errors.physicalAttributes?.height)
            }
            helperText={
              formik.touched.physicalAttributes?.height &&
              formik.errors.physicalAttributes?.height
            }
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            id="physicalAttributes.weight"
            name="physicalAttributes.weight"
            label={t('profile.weight')}
            type="number"
            value={formik.values.physicalAttributes.weight}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.physicalAttributes?.weight &&
              Boolean(formik.errors.physicalAttributes?.weight)
            }
            helperText={
              formik.touched.physicalAttributes?.weight &&
              formik.errors.physicalAttributes?.weight
            }
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            id="physicalAttributes.measurements"
            name="physicalAttributes.measurements"
            label={t('profile.measurements')}
            value={formik.values.physicalAttributes.measurements}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.physicalAttributes?.measurements &&
              Boolean(formik.errors.physicalAttributes?.measurements)
            }
            helperText={
              (formik.touched.physicalAttributes?.measurements &&
                formik.errors.physicalAttributes?.measurements) ||
              t('profile.measurementsHelp')
            }
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            id="physicalAttributes.eyeColor"
            name="physicalAttributes.eyeColor"
            label={t('profile.eyeColor')}
            value={formik.values.physicalAttributes.eyeColor}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {eyeColorOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(option.label)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            id="physicalAttributes.hairColor"
            name="physicalAttributes.hairColor"
            label={t('profile.hairColor')}
            value={formik.values.physicalAttributes.hairColor}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {hairColorOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(option.label)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            id="physicalAttributes.build"
            name="physicalAttributes.build"
            label={t('profile.build')}
            value={formik.values.physicalAttributes.build}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            {buildOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {t(option.label)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            {t('profile.languages')}
          </Typography>
          <Autocomplete
            multiple
            id="languages"
            options={languageOptions}
            value={formik.values.languages}
            onChange={(event, newValue) => {
              formik.setFieldValue('languages', newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('profile.selectLanguages')}
                error={
                  formik.touched.languages && Boolean(formik.errors.languages)
                }
                helperText={formik.touched.languages && formik.errors.languages}
              />
            )}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  label={`${t(`languages.${option.language}`)} (${t(
                    `languageLevels.${option.level}`
                  )})`}
                  {...getTagProps({ index })}
                />
              ))
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              sx={{ minWidth: 200 }}
            >
              {isSaving ? (
                <CircularProgress size={24} sx={{ mr: 1 }} />
              ) : null}
              {t('common.save')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default BasicInfoForm;