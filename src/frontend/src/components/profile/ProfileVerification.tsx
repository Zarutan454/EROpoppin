import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
  CircularProgress,
} from '@mui/material';
import { ImageUploader } from '../common/ImageUploader';
import { useSnackbar } from 'notistack';

interface VerificationStep {
  label: string;
  description: string;
  completed: boolean;
}

export const ProfileVerification: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [idImage, setIdImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  const steps: VerificationStep[] = [
    {
      label: 'Phone Verification',
      description: 'Verify your phone number',
      completed: !!phoneNumber,
    },
    {
      label: 'ID Verification',
      description: 'Upload a government-issued ID',
      completed: !!idImage,
    },
    {
      label: 'Selfie Verification',
      description: 'Take a selfie holding your ID',
      completed: !!selfieImage,
    },
  ];

  const handlePhoneVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/verification/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Phone verification failed');
      }

      enqueueSnackbar('Phone verification code sent', { variant: 'success' });
      setActiveStep(1);
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to verify phone', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleIdUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setIdImage(files[0]);
    setActiveStep(2);
  };

  const handleSelfieUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setSelfieImage(files[0]);
    submitVerification();
  };

  const submitVerification = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phoneNumber', phoneNumber);
      if (idImage) formData.append('idImage', idImage);
      if (selfieImage) formData.append('selfieImage', selfieImage);

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Verification submission failed');
      }

      enqueueSnackbar('Verification submitted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to submit verification', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Profile Verification
        </Typography>

        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label} completed={step.completed}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mt: 4 }}>
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography gutterBottom>
                  {steps[0].description}
                </Typography>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (xxx) xxx-xxxx"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handlePhoneVerification}
                  disabled={!phoneNumber || loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify Phone'}
                </Button>
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography gutterBottom>
                {steps[1].description}
              </Typography>
              <ImageUploader
                onImagesSelected={handleIdUpload}
                maxImages={1}
                acceptedTypes={['image/jpeg', 'image/png']}
              />
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography gutterBottom>
                {steps[2].description}
              </Typography>
              <ImageUploader
                onImagesSelected={handleSelfieUpload}
                maxImages={1}
                acceptedTypes={['image/jpeg', 'image/png']}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};