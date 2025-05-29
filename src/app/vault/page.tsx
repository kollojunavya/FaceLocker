"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";

interface UserData {
  accountNumber: string;
  name: string;
  email: string;
  address: string;
  mobile: string;
  dob: string;
  gender: string;
}

export default function VaultPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the vault.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        } else {
          throw new Error("User data not found");
        }
      } catch (error) {
        console.error("VaultPage: Failed to fetch user data:", error);
        toast({
          title: "Error",
          description: "Failed to load vault data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, authLoading, router, toast]);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      router.push("/login");
    } catch (error) {
      console.error("VaultPage: Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading vault...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Your Secure Vault</h1>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push("/home")}
              className="text-gray-100 border-gray-600 hover:bg-gray-700"
            >
              <Home className="mr-2 h-4 w-4" /> Home
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
          </div>
        </div>

        {userData && (
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
            <h2 className="text-2xl font-semibold mb-4">Account Details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-400">Account Number</p>
                <p className="text-lg">{userData.accountNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Name</p>
                <p className="text-lg">{userData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-lg">{userData.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Mobile</p>
                <p className="text-lg">{userData.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Address</p>
                <p className="text-lg">{userData.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Date of Birth</p>
                <p className="text-lg">{new Date(userData.dob).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Gender</p>
                <p className="text-lg">{userData.gender}</p>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Vault Features</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => toast({ title: "Coming Soon", description: "Transaction history will be available soon." })}
                >
                  View Transaction History
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => toast({ title: "Coming Soon", description: "Document management will be available in a future update." })}
                >
                  Manage Documents
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => toast({ title: "Coming Soon", description: "Settings will be available in a future update." })}
                >
                  Vault Settings
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}