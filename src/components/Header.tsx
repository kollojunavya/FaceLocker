"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { LogOut, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

export function Header() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll to toggle shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      console.log("User logged out");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/login");
    } catch (error: any) {
      console.error("Logout error:", error.message);
      toast({
        title: "Logout Failed",
        description: "An error occurred while logging out.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const names = name.trim().split(" ");
    return names.length === 1
      ? names[0][0].toUpperCase()
      : `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-card shadow-sm transition-shadow duration-300 ${
        isScrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/home" aria-label="Go to homepage">
          <Logo />
        </Link>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar
                  className="h-10 w-10 cursor-pointer border-2 border-primary/20 hover:border-primary/30 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-transform duration-200 hover:scale-110"
                >
                  <AvatarImage
                    src={user?.photoURL || "/images/Avatar.png"}
                    alt={user?.displayName || "User"}
                  />
                  <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 animate-in fade-in-20 slide-in-from-top-2"
                align="end"
                forceMount
              >
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer transition-colors hover:bg-accent"
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer transition-colors"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="hover:scale-105 transition-transform duration-200"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}