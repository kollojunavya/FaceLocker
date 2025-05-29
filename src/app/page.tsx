"use client";

import Link from "next/link";
import Image from "next/image";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Users,
  Zap,
  Eye,
  MessageCircle,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: <Eye className="h-10 w-10 text-primary mb-4" />,
    title: "Advanced Facial Recognition",
    description:
      "Secure access using cutting-edge facial recognition technology, ensuring only you can access your locker.",
  },
  {
    icon: <KeyRound className="h-10 w-10 text-primary mb-4" />,
    title: "Two-Factor Authentication",
    description:
      "Enhanced security with OTPs sent to your registered email for an additional layer of protection.",
  },
  {
    icon: <Lock className="h-10 w-10 text-primary mb-4" />,
    title: "Secure Locker Access",
    description:
      "Your digital and physical items are protected with robust security protocols.",
  },
  {
    icon: <Smartphone className="h-10 w-10 text-primary mb-4" />,
    title: "Mobile Friendly",
    description:
      "Access and manage your FaceLocker account seamlessly from any device, anywhere.",
  },
];

const howItWorksSteps = [
  {
    step: 1,
    title: "Register Account",
    description:
      "Quickly sign up with your details and capture your facial data for secure identification.",
    icon: <Users className="h-8 w-8 text-primary mb-3" />,
  },
  {
    step: 2,
    title: "Verify Identity",
    description:
      "Complete a facial scan and verify your email with a one-time password.",
    icon: <ShieldCheck className="h-8 w-8 text-primary mb-3" />,
  },
  {
    step: 3,
    title: "Access Locker",
    description:
      "Log in securely using your facial data and OTP to access your personal locker.",
    icon: <Lock className="h-8 w-8 text-primary mb-3" />,
  },
];

const projectFeatures = [
  {
    title: "Facial Recognition + Liveness Detection",
    description:
      "Authenticate users with face recognition and eye-blink detection.",
  },
  {
    title: "OTP-Based Multi-Factor Authentication",
    description:
      "A secure OTP is sent to the user’s phone/email to confirm identity.",
  },
  {
    title: "Real-Time Intruder Alerts",
    description:
      "Unauthorized access triggers image capture and instant alerts.",
  },
  {
    title: "Admin Dashboard",
    description: "Monitor access logs and receive real-time alerts.",
  },
  {
    title: "User-Friendly Interface",
    description: "Web interface for secure, mobile-friendly locker management.",
  },
  {
    title: "Comprehensive Logging",
    description: "All events are logged and available for auditing.",
  },
];

function FeatureSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    mode: "snap",
    slides: { perView: 1, spacing: 24 },
    created() {
      setLoaded(true);
    },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (instanceRef.current) {
        instanceRef.current.next();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [instanceRef]);

  return (
    <section className="py-20 md:py-32 lg:py-40 bg-gradient-to-b from-secondary to-background/80 dark:text-white overflow-hidden">
      <div className="container px-6 md:px-10 max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center  dark:text-white tracking-tight">
          Discover FaceLocker's Power
        </h2>
        <div className="relative">
          <div
            ref={sliderRef}
            className="keen-slider w-screen left-1/2 transform -translate-x-1/2"
          >
            {projectFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="keen-slider__slide bg-secondary/95 rounded-3xl p-10 md:p-12 flex flex-col justify-center items-center text-center transform transition-transform duration-500 hover:scale-105 min-h-[600px]"
              >
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-primary dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-lg md:text-xl text-muted-foreground max-w-md">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
          {loaded && instanceRef.current && (
            <div className="flex justify-center mt-8 gap-6">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/70 hover:bg-background/90 h-12 w-12"
                onClick={() => instanceRef.current?.prev()}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/70 hover:bg-background/90 h-12 w-12"
                onClick={() => instanceRef.current?.next()}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}
          <div className="flex justify-center mt-6 gap-3">
            {projectFeatures.map((_, idx) => (
              <div
                key={idx}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? "bg-primary scale-150"
                    : "bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <FeatureSlider />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 lg:py-40 bg-secondary overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 opacity-50"></div>
          <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              FaceLocker: Unparalleled Security,{" "}
              <br className="hidden md:inline" /> Effortless Access.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
              Experience the next generation of personal security. FaceLocker
              combines advanced facial recognition with robust multi-factor
              authentication to protect what matters most to you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  Get Started Free
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  Login to Your Account
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Why Choose FaceLocker?
              </h2>
              <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                Discover the powerful features that make FaceLocker the ultimate
                security solution.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="text-center shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col"
                >
                  <CardHeader className="items-center">
                    {feature.icon}
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-16 md:py-24 lg:py-32 bg-secondary"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Simple Steps to Secure Access
              </h2>
              <p className="text-lg text-muted-foreground mt-2">
                Getting started with FaceLocker is quick and easy.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
              <div
                className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 border-t-2 border-dashed border-primary/50 w-2/3 mx-auto transform -translate-y-1/2"
                style={{ zIndex: 0, top: "calc(2rem + 16px)" }}
              ></div>
              {howItWorksSteps.map((step) => (
                <div
                  key={step.step}
                  className="relative z-10 flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-lg"
                >
                  <div className="bg-primary/10 p-4 rounded-full mb-4">
                    {step.icon}
                  </div>
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Step {step.step}
                  </span>
                  <h3 className="text-xl font-semibold mb-2 mt-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 md:py-24 lg:py-32 text-center bg-gradient-to-b from-background to-secondary/50">
          <div className="container mx-auto px-4 md:px-6">
            <Zap className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Ready to Secure Your World?
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Join thousands of users who trust FaceLocker for top-tier security
              and peace of mind. Create your account today!
            </p>
            <Link href="/register">
              <Button
                size="lg"
                className="text-xl px-10 py-8 shadow-xl hover:shadow-2xl transition-shadow transform hover:scale-105"
              >
                Sign Up Now & Get Protected
              </Button>
            </Link>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Trusted by Users
              </h2>
              <p className="text-lg text-muted-foreground mt-2">
                See what people are saying about FaceLocker.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((_, i) => (
                <Card key={i} className="shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <Image
                        src={`https://placehold.co/40x40.png?text=U${i + 1}`}
                        alt={`User ${i + 1}`}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                      <div>
                        <p className="font-semibold">User {i + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          Verified Reviewer
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground italic">
                      "FaceLocker is a game-changer! So easy to use and
                      incredibly secure. Highly recommended."
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link href="/reviews/view">
                <Button variant="outline">
                  Read More Reviews <MessageCircle className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
