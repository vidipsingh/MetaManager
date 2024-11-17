// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // If no token and no session, redirect to login
        if (!token && !session && status !== "loading") {
          router.push("/login");
          return;
        }

        // Try to get user data
        const res = await fetch("/api/getUserData", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token || session?.customToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          setIsLoading(false);
        } else {
          // If API call fails, clear token and redirect
          localStorage.removeItem("token");
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth error:", error);
        localStorage.removeItem("token");
        router.push("/login");
      }
    };

    // Only run validation if session status is not loading
    if (status !== "loading") {
      validateAuth();
    }
  }, [session, status, router]);

  const handleLogout = async () => {
    try {
      // Clear local storage token
      localStorage.removeItem("token");
  
      // Sign the user out using next-auth
      await signOut({ redirect: false });
  
      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/95">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-900"></div>
      </div>
    );
  }

  if (!userData) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-black/95 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {userData.name || userData.email}!
          </h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-purple-900 text-white rounded hover:bg-purple-950 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}