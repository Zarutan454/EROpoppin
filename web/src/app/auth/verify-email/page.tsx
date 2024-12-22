'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmailWithToken(token);
    }
  }, [searchParams]);

  const verifyEmailWithToken = async (token: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await verifyEmail(token);
      setSuccess('Email verified successfully. You can now sign in.');
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');

    try {
      await resendVerificationEmail();
      setSuccess('Verification email sent successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <CardDescription>
            Check your email for a verification link or request a new one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-4 text-red-500">
              <XCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-4 text-green-500">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm">{success}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-pink-500/10 p-3">
                <Mail className="h-6 w-6 text-pink-500" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-gray-200">Check your email</h3>
                <p className="mt-1 text-sm text-gray-400">
                  We sent you a verification link. Click the link to verify your
                  email address.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {!success && (
            <Button
              variant="outline"
              onClick={handleResendEmail}
              isLoading={isResending}
              className="w-full"
            >
              Resend verification email
            </Button>
          )}
          <p className="text-center text-sm text-gray-400">
            Having trouble?{' '}
            <a href="/support" className="text-pink-500 hover:text-pink-400">
              Contact support
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}