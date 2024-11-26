// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Header from "@/components/DashboardHeader/Header";
import { CiSearch } from "react-icons/ci";
import { RxDashboard } from "react-icons/rx";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { HiOutlineUserGroup } from "react-icons/hi";
import { IoCalendarOutline } from "react-icons/io5";
import { IoCallOutline } from "react-icons/io5";
import { TbCheckbox } from "react-icons/tb";

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
    <div className="min-h-screen">
      {/* <div className="max-w-4xl mx-auto">
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
      </div> */}
      <Header />
      <div className="min-h-screen w-1/5 py-4 ml-[0.5px] bg-zinc-100 border-r-[1.5px] border-gray-300">
      <div className="flex gap-1 items-center w-4/5 bg-white mx-auto rounded-md border-gray-400 border-[1px]">
        <CiSearch className="mx-1"/>
        <input type="text" placeholder="Search" className="w-36 py-0.5 px-0.5 focus:outline-none focus:ring-0"/>
      </div>

      <div className="font-semibold text-sm mx-6 my-3 text-black/80">MENU</div>

      <div className="flex gap-2 items-center mx-6 mb-2 py-1 px-1.5 cursor-pointer rounded-md hover:bg-purple-300/60">
        <RxDashboard />
        <h1>Dashboard</h1>
      </div>

      <div className="flex gap-2 items-center mx-6 mb-2 py-1 px-1.5 cursor-pointer rounded-md hover:bg-purple-300/60">
        <IoChatbubbleEllipsesOutline />
        <h1>Chat</h1>
      </div>

      <div className="flex gap-2 items-center mx-6 mb-2 py-1 px-1.5 cursor-pointer rounded-md hover:bg-purple-300/60">
        <HiOutlineUserGroup />
        <h1>Team</h1>
      </div>

      <div className="flex gap-2 items-center mx-6 mb-2 py-1 px-1.5 cursor-pointer rounded-md hover:bg-purple-300/60">
        <IoCalendarOutline />
        <h1>Calendar</h1>
      </div>

      <div className="flex gap-2 items-center mx-6 mb-2 py-1 px-1.5 cursor-pointer rounded-md hover:bg-purple-300/60">
        <IoCallOutline />
        <h1>Calls</h1>
      </div>

      <div className="flex gap-2 items-center mx-6 mb-2 py-1 px-1.5 cursor-pointer rounded-md hover:bg-purple-300/60">
        <TbCheckbox />
        <h1>To-Do List</h1>
      </div>
    </div>
    </div>
  );
}