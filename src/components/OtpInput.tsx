"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { otpSchema, type OtpFormData } from '@/lib/schemas';

interface OtpInputProps {
  email?: string;
  onSubmit: (data: OtpFormData) => void;
  onResendOtp: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export function OtpInputComponent({ email, onSubmit, onResendOtp, isLoading, isDisabled }: OtpInputProps) {
  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="otp">Enter OTP</FormLabel>
              <FormControl>
                <Input
                  id="otp"
                  placeholder="Enter 6-digit OTP"
                  {...field}
                  disabled={isDisabled || isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading || isDisabled}>
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={onResendOtp}
          disabled={isLoading || !isDisabled}
        >
          Resend OTP
        </Button>
      </form>
    </Form>
  );
}