"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface UnknownUserLog {
  id: string;
  userId: string;
  timestamp: string;
  imageData: string;
  emailSent: boolean;
}

export default function UnknownLogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [logs, setLogs] = useState<UnknownUserLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view unknown user logs.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        const db = getFirestore();
        const q = query(collection(db, "unknown_user_logs"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const logData: UnknownUserLog[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as UnknownUserLog));
        setLogs(logData);
      } catch (error: any) {
        console.error("Error fetching unknown user logs:", error);
        toast({
          title: "Error",
          description: "Failed to load unknown user logs.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, [user, authLoading, router, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-10">
        <Card className="shadow-xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Unknown User Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No unauthorized access attempts found.</p>
            ) : (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {logs.map(log => (
                  <Card key={log.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Attempt at {new Date(log.timestamp).toLocaleString()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {log.imageData ? (
                        <img src={log.imageData} alt="Unknown user" className="w-full h-auto rounded-lg" />
                      ) : (
                        <p className="text-red-500">No image available</p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                        Email Sent: {log.emailSent ? "Yes" : "No"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}