"use client"

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import github_dp from '../../public/images/112854574.png';
import { GoSidebarExpand } from "react-icons/go";
import { CiCircleQuestion } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import { LuSun } from "react-icons/lu";
import { useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";
import { IoTimerOutline } from "react-icons/io5";
import PomodoroTimer from './Pomodoro';

const Header = () => {
    const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null);
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(false);
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
        } else {
          // If API call fails, clear token and redirect
          localStorage.removeItem("token");
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
  };


  if (!userData) {
    // router.push("/login");
    return null;
  }
  return (
    <div className='border-b-[1.5px] flex h-16 justify-between border-b-gray-300'>
        <div className='flex px-4 pt-4 pb-2 items-center gap-16 bg-zinc-200'>
            <div className='flex items-center gap-2'>
                <div>
                    <Image src={github_dp} width={35} height={35} alt='' className='rounded-full' />
                </div>
                <div className=''>
                    <h1 className='font-semibold text-sm'>Org Name</h1>
                    <h1 className='text-gray-600 text-xs'>Creative Studio</h1>
                </div>
            </div>
            <div className='items-center -mr-0.5'>
                <GoSidebarExpand className='w-5 h-5 ml-4 cursor-pointer hover:text-black/70'/>
            </div>
        </div>
        
        <div className='flex'>
                <div className='mx-1.5 flex items-center'>
                {isDarkMode ? (
                    <LuSun className="h-7 w-7 cursor-pointer hover:text-black/60" onClick={toggleTheme} />
                ) : (
                    <DarkModeOutlinedIcon className="h-7 w-7 cursor-pointer hover:text-black/60" onClick={toggleTheme} />
                )}
                </div>
            <div className='flex gap-2 items-center my-3 pr-3 pl-1 border-r-[1.5px] border-r-gray-300 '>
                {/* <IoTimerOutline className='w-7 h-7 cursor-pointer hover:text-black/60'/> */}
                <PomodoroTimer />
                <CiCircleQuestion className='w-7 h-7 cursor-pointer hover:text-black/60'/>
                <div className='flex'>
                    <IoIosNotificationsOutline  className='w-7 h-7 cursor-pointer hover:text-black/60'/>
                    <div className='bg-red-500 w-1.5 rounded-full h-1.5 -ml-3 mt-1.5'></div>
                </div>
            </div>
            <div className='flex items-center px-2 mx-0.5 w-full gap-2 hover:bg-zinc-200 cursor-pointer'>
                <div className=''>
                    <Image src={github_dp} width={30} height={30} alt='' className='rounded-full' />
                </div>
                <div className='text-sm'>
                    <h1 className="font-semibold">{userData.name || userData.email}</h1>
                    <h1 className='text-gray-600'>Creative Studio</h1>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Header
