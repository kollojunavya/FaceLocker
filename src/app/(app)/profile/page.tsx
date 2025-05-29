"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { auth, db } from "@/lib/firebase";
import { sendOtpAction, verifyOtpAction, verifyLockerPasswordAction } from "@/app/auth/authAction";
import { LoaderCircle, X } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

// Schemas
const sendOtpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const verifyOtpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must be numeric"),
});

const personalInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  gender: z.enum(["male", "female", "other"], { message: "Please select a gender" }),
  address: z.string().min(1, "Address is required"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const lockerPasswordSchema = z.object({
  currentLockerPassword: z.string().min(8, "Current locker password must be at least 8 characters"),
  newLockerPassword: z.string().min(8, "New locker password must be at least 8 characters"),
});

type SendOtpFormData = z.infer<typeof sendOtpSchema>;
type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type LockerPasswordFormData = z.infer<typeof lockerPasswordSchema>;

interface User {
  uid: string;
  email: string;
  name: string;
  avatar?: string;
  accountNumber: string;
  mobile: string;
  dob: string;
  gender: "male" | "female" | "other";
  address: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState<number | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState<"password" | "locker" | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null); // Ref to control OTP input

  // Forms
  const sendOtpForm = useForm<SendOtpFormData>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { email: "" },
  });

  const verifyOtpForm = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: "" },
  });

  const personalInfoForm = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: { name: "", mobile: "", dob: "", gender: "other", address: "" },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const lockerPasswordForm = useForm<LockerPasswordFormData>({
    resolver: zodResolver(lockerPasswordSchema),
    defaultValues: { currentLockerPassword: "", newLockerPassword: "" },
  });

  // Debug OTP field value
  useEffect(() => {
    const subscription = verifyOtpForm.watch((value) => {
      console.log("verifyOtpForm otp value:", value.otp);
      if (value.otp && !/^\d{0,6}$/.test(value.otp)) {
        console.warn("Invalid OTP value detected:", value.otp);
        verifyOtpForm.setValue("otp", "");
        if (otpInputRef.current) {
          otpInputRef.current.value = "";
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [verifyOtpForm]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            const data = docSnap.data() as User;
            setUser({ ...data, uid: currentUser.uid, email: currentUser.email || "" });
            sendOtpForm.setValue("email", currentUser.email || "");
            personalInfoForm.setValue("name", data.name);
            personalInfoForm.setValue("mobile", data.mobile);
            personalInfoForm.setValue("dob", data.dob);
            personalInfoForm.setValue("gender", data.gender);
            personalInfoForm.setValue("address", data.address);
          } else {
            toast({ title: "Error", description: "User data not found. Please contact support.", variant: "destructive" });
          }
        } else {
          toast({ title: "Error", description: "User not authenticated. Please log in.", variant: "destructive" });
        }
      } catch (error: any) {
        console.error("Error fetching user:", error.message);
        toast({ title: "Error", description: "Failed to load user data. Try again later.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [sendOtpForm, personalInfoForm, toast]);

  // Reset OTP form on mount and when OTP is sent
  useEffect(() => {
    verifyOtpForm.reset({ otp: "" });
    if (otpInputRef.current) {
      otpInputRef.current.value = "";
    }
  }, [isOtpSent, verifyOtpForm]);

  // OTP countdown timer
  useEffect(() => {
    if (otpExpiresAt) {
      const interval = setInterval(() => {
        const secondsLeft = differenceInSeconds(new Date(otpExpiresAt), new Date());
        setOtpTimer(secondsLeft > 0 ? secondsLeft : null);
        if (secondsLeft <= 0) {
          setIsOtpSent(false);
          setOtpExpiresAt(null);
          setShowOtpForm(null);
          setIsOtpVerified(false);
          verifyOtpForm.reset({ otp: "" });
          if (otpInputRef.current) {
            otpInputRef.current.value = "";
          }
          toast({ title: "Error", description: "OTP has expired. Please request a new one.", variant: "destructive" });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpExpiresAt, toast, verifyOtpForm]);

  const handleSendOtp = useCallback(
    async (data: SendOtpFormData, type: "password" | "locker") => {
      setIsLoading(true);
      try {
        console.log("Sending OTP to:", data.email);
        const response = await sendOtpAction(data.email);
        if (response.success) {
          setIsOtpSent(true);
          setOtpExpiresAt(response.expiresAt ?? null);
          setShowOtpForm(type);
          verifyOtpForm.reset({ otp: "" });
          if (otpInputRef.current) {
            otpInputRef.current.value = "";
            otpInputRef.current.focus();
          }
          toast({ title: "Success", description: `OTP sent to ${data.email}.` });
        } else {
          toast({ title: "Error", description: response.message || "Failed to send OTP.", variant: "destructive" });
        }
      } catch (error: any) {
        console.error("Client error sending OTP:", error.message);
        toast({ title: "Error", description: error.message || "Failed to send OTP. Please try again.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, verifyOtpForm]
  );

  const handleVerifyOtp = useCallback(
    async (data: VerifyOtpFormData) => {
      setIsLoading(true);
      try {
        console.log("Verifying OTP:", data.otp, "for email:", user?.email);
        const response = await verifyOtpAction(user?.email || "", data.otp);
        if (response.success) {
          setIsOtpVerified(true);
          toast({ title: "Success", description: "OTP verified successfully." });
          setIsOtpSent(false);
          setOtpExpiresAt(null);
          setOtpTimer(null);
          verifyOtpForm.reset({ otp: "" });
          if (otpInputRef.current) {
            otpInputRef.current.value = "";
          }
        } else {
          toast({ title: "Error", description: response.message || "Invalid OTP. Please try again.", variant: "destructive" });
        }
      } catch (error: any) {
        console.error("Client error verifying OTP:", error.message);
        toast({ title: "Error", description: error.message || "Failed to verify OTP. Please try again.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, user?.email, verifyOtpForm]
  );

  const handleUpdatePersonalInfo = useCallback(
    async (data: PersonalInfoFormData) => {
      setIsLoading(true);
      try {
        if (user) {
          const userDoc = doc(db, "users", user.uid);
          await updateDoc(userDoc, {
            name: data.name,
            mobile: data.mobile,
            dob: data.dob,
            gender: data.gender,
            address: data.address,
          });
          setUser({ ...user, ...data });
          toast({ title: "Success", description: "Personal information updated successfully." });
          personalInfoForm.reset(data);
        }
      } catch (error: any) {
        console.error("Error updating personal info:", error.message);
        toast({ title: "Error", description: error.message || "Failed to update personal information.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, user, personalInfoForm]
  );

  const handleChangePassword = useCallback(
    async (data: PasswordFormData) => {
      if (!isOtpVerified) {
        toast({ title: "Error", description: "Please verify OTP to update password.", variant: "destructive" });
        return;
      }
      setIsLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (currentUser && user?.email) {
          const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
          await updatePassword(currentUser, data.newPassword);
          toast({ title: "Success", description: "Password updated successfully." });
          passwordForm.reset();
          setIsOtpVerified(false);
          setShowOtpForm(null);
        }
      } catch (error: any) {
        console.error("Error changing password:", error.message);
        let message = "Failed to update password. Please try again.";
        if (error.code === "auth/wrong-password") message = "Incorrect current password.";
        toast({ title: "Error", description: message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, user?.email, isOtpVerified, passwordForm]
  );

  const handleChangeLockerPassword = useCallback(
    async (data: LockerPasswordFormData) => {
      if (!isOtpVerified) {
        toast({ title: "Error", description: "Please verify OTP to update locker password.", variant: "destructive" });
        return;
      }
      setIsLoading(true);
      try {
        if (user) {
          const verifyResponse = await verifyLockerPasswordAction(user.uid, data.currentLockerPassword);
          if (!verifyResponse.success) {
            throw new Error(verifyResponse.message);
          }
          const hashedLockerPassword = await import("bcryptjs").then((bcrypt) => bcrypt.hash(data.newLockerPassword, 10));
          const userDoc = doc(db, "users", user.uid);
          await updateDoc(userDoc, { lockerPassword: hashedLockerPassword });
          toast({ title: "Success", description: "Locker password updated successfully." });
          lockerPasswordForm.reset();
          setIsOtpVerified(false);
          setShowOtpForm(null);
        }
      } catch (error: any) {
        console.error("Error changing locker password:", error.message);
        toast({ title: "Error", description: error.message || "Failed to update locker password.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [toast, user, isOtpVerified, lockerPasswordForm]
  );

  const handleCancel = useCallback(() => {
    setShowOtpForm(null);
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpExpiresAt(null);
    setOtpTimer(null);
    sendOtpForm.reset({ email: user?.email || "" });
    verifyOtpForm.reset({ otp: "" });
    if (otpInputRef.current) {
      otpInputRef.current.value = "";
    }
    toast({ title: "Cancelled", description: "Action cancelled." });
  }, [toast, sendOtpForm, verifyOtpForm, user?.email]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 text-lg text-foreground"
        >
          <LoaderCircle className="h-6 w-6 animate-spin" />
          Loading profile...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-2xl rounded-2xl border border-border/50 overflow-hidden">
              <CardHeader className="text-center bg-gradient-to-r from-primary/20 to-secondary/20 py-10">
                <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-background shadow-lg rounded-full">
                  <AvatarImage src={user.avatar || "https://placehold.co/100x100.png?text=User"} alt={user.name} />
                  <AvatarFallback className="text-3xl font-semibold">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-4xl font-bold tracking-tight">{user.name}</CardTitle>
                <p className="text-lg text-muted-foreground mt-2">{user.email}</p>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-12">
                {/* Account Info */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-foreground">Account Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-muted/30 p-6 rounded-xl shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-foreground">Account Number</p>
                      <p className="text-muted-foreground font-mono">{user.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Account Status</p>
                      <p className="text-muted-foreground">
                        {user.emailVerified ? (
                          <span className="text-green-500 font-semibold">Active</span>
                        ) : (
                          <span className="text-yellow-500 font-semibold">Pending Verification</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Created At</p>
                      <p className="text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* OTP Form */}
                <AnimatePresence>
                  {showOtpForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-semibold text-foreground">
                          {showOtpForm === "password" ? "Verify to Change Password" : "Verify to Change Locker Password"}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancel}
                          aria-label="Cancel OTP verification"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter your email to receive an OTP for verification.
                      </p>
                      {!isOtpSent ? (
                        <Form {...sendOtpForm}>
                          <form
                            onSubmit={sendOtpForm.handleSubmit((data) => handleSendOtp(data, showOtpForm))}
                            className="space-y-4"
                          >
                            <FormField
                              control={sendOtpForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="email"
                                      placeholder="Enter your email"
                                      autoComplete="email"
                                      name={`email-${Date.now()}`} // Prevent autofill
                                      className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                                      aria-required="true"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-4">
                              <Button
                                type="submit"
                                className="flex-1 bg-primary hover:bg-primary/90 transition-colors duration-200 rounded-lg"
                                disabled={isLoading}
                              >
                                {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-lg"
                                onClick={handleCancel}
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <Form {...verifyOtpForm} key={`otp-form-${isOtpSent}`}>
                          <form onSubmit={verifyOtpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                            <FormField
                              control={verifyOtpForm.control}
                              name="otp"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Enter OTP</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="text"
                                      placeholder="Enter 6-digit OTP"
                                      maxLength={6}
                                      autoComplete="off"
                                      name={`otp-${Date.now()}`} // Prevent autofill
                                      ref={otpInputRef}
                                      className="border border-input rounded-lg focus:ring-2 focus:ring-primary font-mono text-center tracking-widest transition-all duration-200"
                                      aria-required="true"
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        field.onChange(value);
                                        console.log("OTP input changed to:", value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-4">
                              <Button
                                type="submit"
                                className="flex-1 bg-primary hover:bg-primary/90 transition-colors duration-200 rounded-lg"
                                disabled={isLoading}
                              >
                                {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Verify OTP"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-lg"
                                onClick={handleCancel}
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                            {otpExpiresAt && otpTimer && (
                              <div className="space-y-2">
                                <p className="text-sm text-center font-medium text-destructive bg-destructive/10 p-2 rounded-lg">
                                  OTP expires in: {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, "0")}
                                </p>
                                <Progress
                                  value={(otpTimer / 300) * 100}
                                  className="h-2 [&>div]:bg-destructive bg-destructive/20"
                                />
                              </div>
                            )}
                          </form>
                        </Form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-foreground">Personal Information</h3>
                  <Form {...personalInfoForm}>
                    <form onSubmit={personalInfoForm.handleSubmit(handleUpdatePersonalInfo)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={personalInfoForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter your full name"
                                  autoComplete="name"
                                  className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                                  aria-required="true"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={personalInfoForm.control}
                          name="mobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="Enter 10-digit mobile number"
                                  autoComplete="tel"
                                  className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                                  aria-required="true"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={personalInfoForm.control}
                          name="dob"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Date of Birth</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full pl-3 text-left font-normal border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200",
                                        !field.value && "text-muted-foreground"
                                      )}
                                      aria-label="Select date of birth"
                                    >
                                      {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={personalInfoForm.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200 dark:text-gray-100"
                                    aria-label="Select gender"
                                  >
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={personalInfoForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter your address"
                                autoComplete="street-address"
                                className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                                aria-required="true"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 rounded-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Update Personal Info"}
                      </Button>
                    </form>
                  </Form>
                </div>

                {/* Change Password */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-foreground">Change Password</h3>
                  {!showOtpForm && (
                    <Button
                      onClick={() => setShowOtpForm("password")}
                      className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 rounded-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Change Password"}
                    </Button>
                  )}
                  <AnimatePresence>
                    {showOtpForm === "password" && isOtpVerified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Form {...passwordForm}>
                          <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                            <FormField
                              control={passwordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="password"
                                      placeholder="Enter current password"
                                      autoComplete="current-password"
                                      className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                                      aria-required="true"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={passwordForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="password"
                                      placeholder="Enter new password"
                                      autoComplete="new-password"
                                      className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                                      aria-required="true"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-4">
                              <Button
                                type="submit"
                                className="flex-1 bg-primary hover:bg-primary/90 transition-colors duration-200 rounded-lg"
                                disabled={isLoading}
                              >
                                {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Change Password"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-lg"
                                onClick={handleCancel}
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Change Locker Password */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-foreground">Change Locker Password</h3>
                  {!showOtpForm && (
                    <Button
                      onClick={() => setShowOtpForm("locker")}
                      className="w-full bg-primary hover:bg-primary/90 transition-colors duration-200 rounded-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Change Locker Password"}
                    </Button>
                  )}
                  <AnimatePresence>
                    {showOtpForm === "locker" && isOtpVerified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Form {...lockerPasswordForm}>
                          <form onSubmit={lockerPasswordForm.handleSubmit(handleChangeLockerPassword)} className="space-y-4">
                            <FormField
                              control={lockerPasswordForm.control}
                              name="currentLockerPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Current Locker Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="password"
                                      placeholder="Enter current locker password"
                                      autoComplete="off"
                                      className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                                      aria-required="true"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={lockerPasswordForm.control}
                              name="newLockerPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>New Locker Password</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="password"
                                      placeholder="Enter new locker password"
                                      autoComplete="off"
                                      className="border border-input rounded-lg focus:ring-2 focus:ring-primary transition-all duration-200"
                                      aria-required="true"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-4">
                              <Button
                                type="submit"
                                className="flex-1 bg-primary hover:bg-primary/90 transition-colors duration-200 rounded-lg"
                                disabled={isLoading}
                              >
                                {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : "Change Locker Password"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className=" rounded-lg"
                                onClick={handleCancel}
                                disabled={isLoading}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <PublicFooter />
      {isLoading && (
        <motion.div
          initial={{ opacity: "0" }}
          animate={{ opacity: "1" }}
          exit={{ opacity: "0" }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="flex items-center gap-3 text-lg text-foreground bg-muted/50 p-4 rounded-lg shadow-lg">
            <LoaderCircle className="h-6 w-6 animate-spin" />
            Processing...
          </div>
        </motion.div>
      )}
    </div>
  );
}