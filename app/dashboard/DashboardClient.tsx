"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // `next/navigation` for App Router

export default function DashboardClient({ session }: { session: any }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  // Check if the user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      // Fetch user data from the backend
      const fetchUserData = async () => {
        try {
          const res = await fetch("/api/getUserData", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (data?.name) {
            setUserName(data.name);
            setIsAuthenticated(true);
          } else {
            // If token is invalid or user data is not found, redirect to login
            router.push("/login");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          router.push("/login");
        }
      };

      fetchUserData();
    }
  }, [router]);

  // Function to handle logout
  const handleLogout = () => {
    // Remove the token from localStorage
    localStorage.removeItem("token");
    // Redirect the user to the login page
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
