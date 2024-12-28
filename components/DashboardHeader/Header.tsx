"use client";
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import github_dp from '../../public/images/112854574.png';
import { GoSidebarExpand, GoSidebarCollapse } from "react-icons/go";
import { CiCircleQuestion } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";
import PomodoroTimer from './Pomodoro';
import { ModeToggle } from '../Theme/ModeToggle';

const Header = ({ onToggleSidebar }) => {
    const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null);
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState(false); // State for dropdown visibility
    const { data: session, status } = useSession();

    useEffect(() => {
        const validateAuth = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token && !session && status !== "loading") {
                    router.push("/login");
                    return;
                }
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
                    localStorage.removeItem("token");
                }
            } catch (error) {
                console.error("Auth error:", error);
                localStorage.removeItem("token");
                router.push("/login");
            }
        };

        if (status !== "loading") {
            validateAuth();
        }
    }, [session, status, router]);

    const handleSidebarToggle = () => {
        setIsSidebarExpanded(!isSidebarExpanded);
        onToggleSidebar();
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleLogout = async () => {
        try {
            localStorage.removeItem("token");
            await signOut({ redirect: false });
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
            router.push("/login");
        }
    };

    if (!userData) {
        return null;
    }

    return (
        <div className='border-b-[1.5px] flex h-16 justify-between dark:bg-slate-950 dark:border-b-gray-500 border-b-gray-300'>
            <div className='flex px-4 pt-4 pb-2 w-1/5 border-r-[1.5px] border-gray-300 dark:border-gray-500 items-center gap-16 bg-zinc-200 dark:bg-slate-950'>
                <div className='flex items-center gap-2'>
                    <Image src={github_dp} width={35} height={35} alt='' className='rounded-full' />
                    <div className='dark:bg-slate-950'>
                        <h1 className='font-semibold text-sm dark:bg-slate-950'>Org Name</h1>
                        <h1 className='text-gray-600 text-xs dark:text-white/70'>Creative Studio</h1>
                    </div>
                </div>
                <div className='items-center -mr-0.5'>
                    {isSidebarExpanded ? (
                        <GoSidebarCollapse
                            onClick={handleSidebarToggle}
                            className='w-5 h-5 ml-4 cursor-pointer dark:hover:text-white/80 hover:text-black/70'
                        />
                    ) : (
                        <GoSidebarExpand
                            onClick={handleSidebarToggle}
                            className='w-5 h-5 ml-4 cursor-pointer dark:hover:text-white/80 hover:text-black/70'
                        />
                    )}
                </div>
            </div>
            <div className='flex relative'>
                <div className='flex gap-2 items-center my-3 pr-3 pl-1 border-r-[1.5px] border-r-gray-300'>
                    <ModeToggle />
                    <PomodoroTimer />
                    <CiCircleQuestion className='w-7 h-7 cursor-pointer dark:hover:text-white/80 hover:text-black/60' />
                    <div className='flex'>
                        <IoIosNotificationsOutline className='w-7 h-7 cursor-pointer dark:hover:text-white/80 hover:text-black/60' />
                        <div className='bg-red-500 w-1.5 rounded-full h-1.5 -ml-3 mt-1.5'></div>
                    </div>
                </div>
                
                {/* Profile Icon and Dropdown */}
                <div className='relative flex items-center px-2 mx-0.5 w-full hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-2 cursor-pointer' onClick={toggleDropdown}>
                    <Image src={github_dp} width={30} height={30} alt='' className='rounded-full' />
                    <div className='text-sm'>
                        <h1 className="font-semibold">{userData.name || userData.email}</h1>
                        <h1 className='text-gray-600 dark:text-white/70'>Creative Studio</h1>
                    </div>

                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-24 w-full bg-white rounded-md shadow-lg z-10">
                            <button 
                                onClick={handleLogout} 
                                className="block w-full text-left px-4 py-2 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header;
