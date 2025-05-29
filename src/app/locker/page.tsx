"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import FacialRecognition from "@/components/FacialRecognition";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";
import { Lock } from "lucide-react";

export default function LockerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFaceScanComplete, setIsFaceScanComplete] = useState(false);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the locker.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    // Check for reference images
    let imagesExist = false;
    let imageCount = 0;
    for (let i = 0; i < 20; i++) {
      if (localStorage.getItem(`reference_image_${user.uid}_${i}`)) {
        imageCount++;
        if (imageCount >= 3) {
          imagesExist = true;
          break;
        }
      }
    }
    if (!imagesExist) {
      console.log("LockerPage: Insufficient reference images, redirecting to /reference-upload");
      toast({
        title: "Reference Images Required",
        description: "Please upload at least three reference images for facial recognition.",
        variant: "destructive",
      });
      router.push("/reference-upload");
      return;
    }

    // Initialize camera
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log("LockerPage: Video metadata loaded, video is ready");
            if (videoRef.current) {
              videoRef.current.play().catch((error: Error) => {
                console.error("LockerPage: Error playing video:", error);
                toast({
                  title: "Video Error",
                  description: "Failed to start video feed.",
                  variant: "destructive",
                });
              });
            }
          };
        }
      } catch (error) {
        console.error("LockerPage: Camera initialization error:", error);
        toast({
          title: "Camera Error",
          description: "Failed to access camera. Please grant permissions.",
          variant: "destructive",
        });
      }
    };
    console.log("LockerPage: Initiating face scan");
    initCamera();

    return () => {
      console.log("LockerPage: Cleaning up video stream");
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
      }
    };
  }, [user, authLoading, router, toast]);

  const handlePasswordSubmit = async () => {
    if (!isFaceScanComplete) {
      toast({
        title: "Face Scan Required",
        description: "Please complete the face scan before entering the password.",
        variant: "destructive",
      });
      return;
    }
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter a password.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user!.uid));
      if (!userDoc.exists() || !userDoc.data().lockerPassword) {
        throw new Error("No locker password set for this user");
      }
      const hashedPassword = userDoc.data().lockerPassword;
      const isPasswordValid = await bcrypt.compare(password, hashedPassword);
      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }
      toast({
        title: "Success",
        description: "Vault access granted.",
      });
      router.push("/vault");
    } catch (error) {
      console.error("LockerPage: Password verification error:", error);
      toast({
        title: "Error",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-700 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
          Your FaceLocker
          <Lock className="inline-block ml-2 h-6 w-6" />
        </h1>
        <div className="relative mb-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg shadow-inner border-2 border-gray-300"
            style={{ aspectRatio: "4/3" }}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        {user && (
          <FacialRecognition
            videoRef={videoRef}
            canvasRef={canvasRef}
            onScanComplete={(success) => {
              console.log("LockerPage: Facial recognition complete, success:", success);
              toast({
                title: success ? "Verification Successful" : "Verification Failed",
                description: success
                  ? "User verified successfully. Please enter your password."
                  : "Unknown user found. An email has been sent, and the attempt has been logged.",
                variant: success ? "default" : "destructive",
              });
              setIsFaceScanComplete(success);
            }}
            userEmail={user.email || ""}
          />
        )}
        {isFaceScanComplete && (
          <div className="mt-6">
            <Input
              type="password"
              placeholder="Enter locker password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
            />
            <Button
              onClick={handlePasswordSubmit}
              disabled={isSubmitting}
              className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? "Verifying..." : "Unlock Vault"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}