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

// Import individual section components
import DashboardContent from "@/components/DashboardContent";
import ChatComponent from "@/components/ChatComponent";

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState("Dashboard");
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        console.log("Session data:", session);
        console.log("Session status:", status);

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
                return <ChatComponent />;
            case "Team":
                return <div><h1>Team Section</h1></div>;
            case "Calendar":
                return <div><h1>Calendar Section</h1></div>;
            case "Calls":
                return <div><h1>Calls Section</h1></div>;
            case "To Do List":
                return <div><h1>To Do List Section</h1></div>;
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
            <Header onToggleSidebar={toggleSidebar} onLogout={handleLogout} />

            <div className="flex">
                <div
                    className={`min-h-screen ${isSidebarOpen ? "w-[20%]" : "w-[0%]"} transition-width duration-300 overflow-hidden bg-zinc-100 dark:bg-slate-950 border-r-[1.5px] border-gray-300 dark:border-gray-500 py-4`}
                >
                    {isSidebarOpen && (
                        <>
                            <div className="flex gap-1 items-center bg-white dark:bg-gray-900 mx-4 rounded-md border-gray-400 border-[1px]">
                                <CiSearch className="mx-1" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="w-full py-0.5 px-0.5 focus:outline-none dark:bg-gray-900 focus:ring-0"
                                />
                            </div>

                            <nav className="my-3 dark:text-white mx-4 text-black/80">
                                <h1 className="font-bold">MENU</h1>
                                {menuItems.map(({ icon: Icon, name }) => (
                                    <div
                                        key={name}
                                        className={`flex items-center gap-2 cursor-pointer hover:text-white rounded-md my-1.5 py-1 px-2 ${
                                            activeSection === name
                                                ? "bg-purple-600 dark:bg-purple-800 text-white"
                                                : "hover:bg-purple-600 dark:hover:bg-purple-800"
                                        }`}
                                        onClick={() => setActiveSection(name)}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{name}</span>
                                    </div>
                                ))}
                            </nav>
                        </>
                    )}
                </div>

                <div className="flex-1">
                    {renderSectionContent()}
                </div>
            </div>
        </div>
    );
}