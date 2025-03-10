"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Header from "@/components/DashboardHeader/Header";
import { CiSearch } from "react-icons/ci";
import { RxDashboard } from "react-icons/rx";
import { IoChatbubbleEllipsesOutline, IoCalendarOutline, IoCallOutline } from "react-icons/io5";
import { HiOutlineUserGroup } from "react-icons/hi";
import { TbCheckbox } from "react-icons/tb";
import { FaChalkboard } from "react-icons/fa";

const Chatbot = dynamic(() => import("@/components/Chatbot"), { ssr: false });
const WhiteboardComponent = dynamic(() => import("@/components/WhiteboardComponent"), { ssr: false });
const DashboardContent = dynamic(() => import("@/components/DashboardContent"), { ssr: false });
const ChatComponent = dynamic(() => import("@/components/ChatComponent"), { ssr: false });
const TeamComponent = dynamic(() => import("@/components/TeamComponent"), { ssr: false });
const CallComponent = dynamic(() => import("@/components/CallComponent"), { ssr: false });
const ListComponent = dynamic(() => import("@/components/ListComponent"), { ssr: false });
const CalendarComponent = dynamic(() => import("@/components/CalendarComponent"), { ssr: false });

function DashboardContentWrapper() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<{
    name?: string;
    email?: string;
    ethAddress?: string;
    organization?: { name: string };
  } | null>(null);
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  const menuItems = [
    { icon: RxDashboard, name: "Dashboard" },
    { icon: IoChatbubbleEllipsesOutline, name: "Chat" },
    { icon: HiOutlineUserGroup, name: "Team" },
    { icon: IoCalendarOutline, name: "Calendar" },
    { icon: IoCallOutline, name: "Calls" },
    { icon: TbCheckbox, name: "To Do List" },
    { icon: FaChalkboard, name: "Whiteboard" },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
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
            Authorization: `Bearer ${token || session?.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setUserData({
            ...data,
            ethAddress: session?.user?.ethAddress,
            organization: data.organization,
          });
          console.log("Dashboard user data:", data);

          const usersRes = await fetch("/api/getAllUsers", {
            headers: {
              Authorization: `Bearer ${token || session?.accessToken}`,
            },
          });
          if (usersRes.ok) {
            const allUsers = await usersRes.json();
            const filteredUsers = allUsers.filter(
              (user: { id: string; organizationId: string }) =>
                user.id !== session?.user?.id &&
                user.organizationId === session?.user?.organizationId
            );
            setTeamMembersCount(filteredUsers.length);
            console.log("Team members count:", filteredUsers.length);
          }

          setIsLoading(false);
          if (!data.organization) {
            router.push("/select-org");
          }
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

  const renderSectionContent = () => {
    if (!userData) return null;

    switch (activeSection) {
      case "Dashboard":
        return (
          <DashboardContent
            onTodoClick={() => setActiveSection("To Do List")}
            teamMembersCount={teamMembersCount}
          />
        );
      case "Chat":
        return <ChatComponent initialSelectedUserId={selectedChatUserId || ""} />;
      case "Team":
        return <TeamComponent onChatSelect={handleChatSelect} />;
      case "Calendar":
        return <CalendarComponent />;
      case "Calls":
        return (
          <div className="h-full">
            <CallComponent />
          </div>
        );
      case "To Do List":
        return <ListComponent />;
      case "Whiteboard":
        return <WhiteboardComponent />;
      default:
        return (
          <DashboardContent
            onTodoClick={() => setActiveSection("To Do List")}
            teamMembersCount={teamMembersCount}
          />
        );
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

  const displayName =
    userData.name ||
    (userData.ethAddress
      ? userData.ethAddress.slice(0, 6) + "..." + userData.ethAddress.slice(-4)
      : userData.email);

  return (
    <div className="min-h-screen dark:bg-slate-950 relative">
      <Header
        onToggleSidebar={toggleSidebar}
        onLogout={handleLogout}
        isMobile={isMobile}
        userName={displayName}
        orgName={userData.organization?.name}
      />
      <div className="flex relative">
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={`fixed md:static ${
            isSidebarOpen ? "w-64 sm:w-1/4 md:w-1/5" : "w-0"
          } z-30 md:z-0 pt-4 transition-all duration-300 h-screen dark:bg-slate-950 overflow-hidden`}
        >
          <div className="flex flex-col h-screen">
            <div className="flex gap-1 items-center bg-white dark:bg-gray-900 mx-4 rounded-md border-gray-400 border-[1px]">
              <CiSearch className="mx-1" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-0.5 px-0.5 focus:outline-none dark:bg-gray-900 focus:ring-0"
              />
            </div>

            <nav className="my-3 dark:text-white mx-4 text-black/80 flex-1 h-screen">
              <h1 className="font-bold">MENU</h1>
              {filteredMenuItems.map(({ icon: Icon, name }) => (
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
          className={`flex-1 w-full transition-all duration-300 ${
            isMobile && isSidebarOpen ? "ml-64 md:ml-0" : "ml-0"
          }`}
        >
          <div className="h-full w-full">{renderSectionContent()}</div>
        </main>
      </div>

      <Chatbot />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black/95">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-900"></div>
      </div>
    }>
      <DashboardContentWrapper />
    </Suspense>
  );
}