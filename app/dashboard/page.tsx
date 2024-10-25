"use client";

// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default async function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return <p>Loading...</p>;
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    return <p>You are not logged in. Please sign in.</p>;
  }

  return (
    <div>
      <h1>Welcome, {session.user?.name}!</h1>
    </div>
  );
}
