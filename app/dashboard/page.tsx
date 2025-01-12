"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Header from "@/components/DashboardHeader/Header";
import { CiSearch } from "react-icons/ci";
import { RxDashboard } from "react-icons/rx";
import { IoChatbubbleEllipsesOutline, IoCalendarOutline, IoCallOutline } from "react-icons/io5";
import { HiOutlineUserGroup } from "react-icons/hi";
import { TbCheckbox } from "react-icons/tb";
// import { HiMenuAlt2 } from "react-icons/hi";

import DashboardContent from "@/components/DashboardContent";
import ChatComponent from "@/components/ChatComponent";
import TeamComponent from "@/components/TeamComponent";
import CallComponent from "@/components/CallComponent";
import ListComponent from "@/components/ListComponent";
// import dynamic from 'next/dynamic';

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState("Dashboard");
    const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!session && status !== "loading") {
            router.push("/login");
            return;
        }

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
                    setIsLoading(false);
                } else {
                    localStorage.removeItem("token");
                    router.push("/login");
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

    const handleChatSelect = (userId: string) => {
        setSelectedChatUserId(userId);
        setActiveSection("Chat");
        if (isMobile) setIsSidebarOpen(false);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const menuItems = [
        { icon: RxDashboard, name: "Dashboard" },
        { icon: IoChatbubbleEllipsesOutline, name: "Chat" },
        { icon: HiOutlineUserGroup, name: "Team" },
        { icon: IoCalendarOutline, name: "Calendar" },
        { icon: IoCallOutline, name: "Calls" },
        { icon: TbCheckbox, name: "To Do List" },
    ];

    const renderSectionContent = () => {
        if (!userData) return null;

        switch (activeSection) {
            case "Dashboard":
                return <DashboardContent />;
            case "Chat":
                return <ChatComponent initialSelectedUserId={selectedChatUserId || ''} />;
            case "Team":
                return <TeamComponent onChatSelect={handleChatSelect} />;
            case "Calendar":
                return <div className="p-4"><h1>Calendar Section</h1></div>;
            case "Calls":
                return (
                    <div className="h-full">
                        <CallComponent />
                    </div>
                );
            case "To Do List":
                return <ListComponent />;
            default:
                return <DashboardContent />;
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
        <div className="min-h-screen dark:bg-slate-950">
            <Header onToggleSidebar={toggleSidebar} onLogout={handleLogout} isMobile={isMobile} />

            <div className="flex relative">
                {isMobile && isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-20"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div
                    className={`fixed md:static ${isSidebarOpen ? 'w-64 sm:w-1/4 md:w-1/5' : 'w-0'} z-30 md:z-0 pt-4 transition-all duration-300 h-fullbg-zinc-100 dark:bg-slate-950 border-r-[1.5px] border-gray-300 dark:border-gray-500 overflow-hidden
                    `}
                >
                    {/* Sidebar content */}
                    <div className="flex flex-col h-full">
                        <div className="flex gap-1 items-center bg-white dark:bg-gray-900 mx-4 rounded-md border-gray-400 border-[1px]">
                            <CiSearch className="mx-1" />
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full py-0.5 px-0.5 focus:outline-none dark:bg-gray-900 focus:ring-0"
                            />
                        </div>

                        <nav className="my-3 dark:text-white mx-4 text-black/80 flex-1">
                            <h1 className="font-bold">MENU</h1>
                            {menuItems.map(({ icon: Icon, name }) => (
                                <div
                                    key={name}
                                    className={`flex items-center gap-2 cursor-pointer hover:text-white rounded-md my-1.5 py-1 px-2 ${
                                        activeSection === name
                                            ? "bg-purple-600 dark:bg-purple-800 text-white"
                                            : "hover:bg-purple-600 dark:hover:bg-purple-800"
                                    }`}
                                    onClick={() => {
                                        setActiveSection(name);
                                        if (name === "Chat") {
                                            setSelectedChatUserId(null);
                                        }
                                        if (isMobile) setIsSidebarOpen(false);
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{name}</span>
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>

                <main 
                    className={`flex-1 w-full transition-all duration-300 ${isMobile && isSidebarOpen ? 'ml-64 md:ml-0' : 'ml-0'}`}
                >
                    <div className="h-full w-full">
                        {renderSectionContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}