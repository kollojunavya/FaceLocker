// src/app/(auth)/activate/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { OtpInputComponent } from '@/components/OtpInput';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';
import { sendOtpAction, verifyOtpAction } from '@/app/actions/authActions';

interface OtpFormData {
  otp: string;
}

export default function ActivateAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activationEmail, setActivationEmail] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(300);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  useEffect(() => {
    if (otpTimer <= 0) {
      setIsOtpExpired(true);
      console.log('OTP has expired');
      return;
    }
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    console.log('Checking sessionStorage for activationEmail:', sessionStorage.getItem('activationEmail'));
    let email = sessionStorage.getItem('activationEmail');

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser ? { uid: currentUser.uid, email: currentUser.email } : 'No user');
      if (currentUser) {
        setUser(currentUser);
        if (!email && currentUser.email) {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              email = userDoc.data().email;
              if (email) {
                setActivationEmail(email);
                sessionStorage.setItem('activationEmail', email);
              }
              console.log('Fetched email from Firestore:', email);
            }
          } catch (error: any) {
            console.error('Error fetching user email:', error.message);
          }
        } else {
          setActivationEmail(email);
        }

        // Check if already verified
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().emailVerified) {
          console.log('User already verified, redirecting to /home');
          sessionStorage.removeItem('activationEmail');
          router.push('/home');
        }
      } else {
        setUser(null);
        setActivationEmail(null);
        sessionStorage.removeItem('activationEmail');
        toast({
          title: "Activation Error",
          description: "No user logged in. Please register again.",
          variant: "destructive"
        });
        router.push('/register');
      }
    });
    return () => unsubscribe();
  }, [router, toast]);

  const handleOtpSubmit = async (data: OtpFormData) => {
    if (!user || !activationEmail || isOtpExpired) {
      toast({
        title: "Error",
        description: isOtpExpired ? "OTP has expired. Please resend OTP." : "Invalid activation state.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      console.log('Submitting OTP for verification:', data.otp);
      const verifyResponse = await verifyOtpAction(activationEmail, data.otp);
      if (!verifyResponse.success) {
        console.log('OTP verification failed:', verifyResponse.message);
        throw new Error(verifyResponse.message);
      }
      console.log('OTP verified successfully for email:', activationEmail);

      await updateDoc(doc(db, 'users', user.uid), {
        emailVerified: true,
        verifiedAt: new Date().toISOString()
      });
      
      console.log('Email verified flag set in Firestore for UID:', user.uid);

      toast({
        title: 'Account Activated!',
        description: 'Your account is now active. Welcome to FaceLocker!',
        className: 'bg-positive text-primary-foreground',
      });
      router.push('/home');
    } catch (error: any) {
      console.error('Activation error:', error.message, error.code);
      toast({
        title: 'Activation Failed',
        description: error.message || 'Activation Error',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!activationEmail) return;
    setIsLoading(true);
    try {
      const otpResponse = await sendOtpAction(activationEmail);
      if (!otpResponse.success) {
        throw new Error(otpResponse.message);
      }
      console.log('New OTP sent to:', activationEmail);
      setOtpTimer(300);
      setIsOtpExpired(false);
      toast({
        title: 'New OTP Sent',
        description: `A new OTP has been sent to ${activationEmail}.`,
        duration: 10000,
      });
    } catch (error: any) {
      console.error('Error resending OTP:', error.message);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend OTP.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !activationEmail) {
    return (
      <div className="text-center">
        <h1 className="mb-2 text-2xl font-bold">Activation Link Expired or Invalid</h1>
        <p className="mb-4 text-muted-foreground">Please register again to receive a new activation link.</p>
        <Button onClick={() => router.push('/register')}>Go to Registration</Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-foreground">Activate Your Account</h1>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        Enter the OTP sent to {activationEmail} to activate your account.
      </p>
      <p className="mb-4 text-center text-sm text-muted-foreground">
        OTP expires in: <span className={isOtpExpired ? 'text-destructive' : ''}>{formatTimer(otpTimer)}</span>
      </p>
      <OtpInputComponent
        email={activationEmail}
        onSubmit={handleOtpSubmit}
        onResendOtp={handleResendOtp}
        isLoading={isLoading}
        isDisabled={isOtpExpired}
      />
      {isOtpExpired && (
        <div className="mt-4 text-center">
          <Button onClick={handleResendOtp} disabled={isLoading}>
            {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : 'Resend OTP'}
          </Button>
        </div>
      )}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Wrong email?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register again
        </Link>
      </p>
    </>
  );
}