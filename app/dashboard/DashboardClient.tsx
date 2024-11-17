"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function DashboardClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const checkAuth = async () => {
      // Check for regular JWT token
      const token = localStorage.getItem("token");
      // Check for NextAuth session
      if (!token && !session?.customToken) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch("/api/getUserData", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token || session?.customToken}`,
          },
        });
        const data = await res.json();
        
        if (data?.name) {
          setUserName(data.name);
          setIsAuthenticated(true);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, session]);

  const handleLogout = async () => {
    // Handle both regular and OAuth logout
    localStorage.removeItem("token");
    if (session) {
      await signOut();
    }
    router.push("/login");
  };

  if (!isAuthenticated) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Welcome, {userName}!</h1>
      <button
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>
    </div>
  );
}