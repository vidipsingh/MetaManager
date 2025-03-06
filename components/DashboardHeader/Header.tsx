"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import github_dp from "../../public/images/112854574.png";
import { GoSidebarExpand, GoSidebarCollapse } from "react-icons/go";
import { CiCircleQuestion } from "react-icons/ci";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PomodoroTimer from "./Pomodoro";
import { ModeToggle } from "../Theme/ModeToggle";
import { HiMenuAlt2 } from "react-icons/hi";
import { BiBuildings } from "react-icons/bi";
import { MdDashboard, MdChat, MdGroup, MdCalendarToday, MdCall, MdList, MdOutlineDashboardCustomize } from "react-icons/md";

interface HeaderProps {
  onToggleSidebar: () => void;
  onLogout: () => void;
  isMobile: boolean;
  userName?: string;
  orgName?: string;
}

const Header = ({ onToggleSidebar, onLogout, isMobile, userName, orgName }: HeaderProps) => {
  const [userData, setUserData] = useState<{
    name?: string;
    email?: string;
    ethAddress?: string;
    organization?: { name: string };
  } | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [ipfsStatus, setIpfsStatus] = useState("Disconnected");
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [helpDropdownOpen, setHelpDropdownOpen] = useState(false);
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
            Authorization: `Bearer ${token || session?.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
          console.log("Header user data:", data);
        } else {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Auth error:", error);
        localStorage.removeItem("token");
        router.push("/login");
      }

      setIpfsStatus("Connected");
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
    setHelpDropdownOpen(false);
  };

  const toggleHelpDropdown = () => {
    setHelpDropdownOpen(!helpDropdownOpen);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".profile-dropdown") && !target.closest(".help-dropdown")) {
        setDropdownOpen(false);
        setHelpDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!userData) {
    return null;
  }

  const displayName =
    userName ||
    userData.name ||
    (userData.ethAddress
      ? userData.ethAddress.slice(0, 6) + "..." + userData.ethAddress.slice(-4)
      : userData.email);
  const displayOrgName = orgName || userData.organization?.name || "No Organization";

  const features = [
    { icon: <MdDashboard />, name: "Dashboard", description: "View project overview and stats" },
    { icon: <MdChat />, name: "Chat", description: "Communicate with team members" },
    { icon: <MdGroup />, name: "Team", description: "Manage team members and roles" },
    { icon: <MdCalendarToday />, name: "Calendar", description: "Schedule events and deadlines" },
    { icon: <MdCall />, name: "Calls", description: "Make and manage calls" },
    { icon: <MdList />, name: "Todo List", description: "Track tasks and progress" },
    { icon: <MdOutlineDashboardCustomize />, name: "Whiteboard", description: "Collaborate on a digital whiteboard" },
  ];

  return (
    <div className="border-b-[1.5px] flex h-16 justify-between dark:bg-slate-950 dark:border-b-gray-500 border-b-gray-300">
      <div className="flex px-4 pt-4 pb-2 md:w-1/5.1 border-r-[1.5px] border-gray-300 dark:border-gray-500 items-center gap-4 md:gap-20 bg-zinc-200 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <BiBuildings className="w-5 h-5" />
          <div className="dark:bg-slate-950 hidden sm:block items-center">
            <h1 className="font-semibold text-sm dark:bg-slate-950">{displayOrgName}</h1>
          </div>
        </div>
        <button onClick={handleSidebarToggle} className="focus:outline-none">
          {isMobile ? (
            <HiMenuAlt2 className="w-6 h-6" />
          ) : isSidebarExpanded ? (
            <GoSidebarCollapse className="w-5 h-5 cursor-pointer dark:hover:text-white/80 hover:text-black/70" />
          ) : (
            <GoSidebarExpand className="w-5 h-5 cursor-pointer dark:hover:text-white/80 hover:text-black/70" />
          )}
        </button>
      </div>

      <div className="flex relative flex-1 md:flex-none">
        <div className="hidden md:flex gap-2 items-center my-3 pr-3 pl-1 border-r-[1.5px] border-r-gray-300 justify-center">
          <div className="mt-5 mb-4 mx-1 text-sm dark:text-gray-500 items-center font-semibold">
            IPFS Status: {ipfsStatus}
          </div>
          <ModeToggle />
          <PomodoroTimer />
          <div className="help-dropdown relative">
            <CiCircleQuestion
              className="w-7 h-7 cursor-pointer dark:hover:text-white/80 hover:text-black/60"
              onClick={toggleHelpDropdown}
            />
            {helpDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-700 rounded-md shadow-lg z-50">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-sm border-b-[1px] border-b-gray-300 dark:border-b-black"
                  >
                    <span className="text-gray-600 dark:text-gray-300 w-5 h-5">{feature.icon}</span>
                    <div>
                      <span className="font-semibold">{feature.name}: </span>
                      <span>{feature.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className="profile-dropdown relative flex items-center px-2 mx-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-2 cursor-pointer ml-auto"
          onClick={toggleDropdown}
        >
          <Image src={github_dp} width={30} height={30} alt="" className="rounded-full" />
          <div className="text-sm hidden sm:block">
            <h1 className="font-semibold">{displayName}</h1>
            <h1 className="text-gray-600 dark:text-white/70">{displayOrgName}</h1>
          </div>

          <div className="md:hidden flex items-center gap-2 ml-2">
            <ModeToggle />
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-full w-44 md:w-36 bg-white dark:bg-slate-700 rounded-md shadow-lg z-50">
              <button
                onClick={onLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600 text-red-600 dark:text-red-400"
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