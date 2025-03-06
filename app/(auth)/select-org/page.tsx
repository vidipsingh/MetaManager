"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Alert from "@mui/material/Alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SelectOrganization = () => {
  const [orgName, setOrgName] = useState("");
  const [orgs, setOrgs] = useState([]);
  const [message, setMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error" | "info">("info");
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("User is unauthenticated, redirecting to /login");
      router.push("/login");
      return;
    }

    const fetchOrganizations = async () => {
      try {
        console.log("Fetching organizations with token:", session?.accessToken); // Updated to accessToken
        const res = await fetch("/api/organizations", {
          headers: {
            Authorization: `Bearer ${session?.accessToken || ""}`, // Updated to accessToken
          },
        });
        if (res.ok) {
          const data = await res.json();
          setOrgs(data);
        } else {
          console.error("Failed to fetch organizations:", res.status, await res.text());
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };

    if (status === "authenticated" && session?.accessToken) { // Updated to accessToken
      fetchOrganizations();
    }
  }, [status, router, session]);

  const handleCreateOrg = async () => {
    if (!session?.accessToken) { // Updated to accessToken
      setMessage("You must be signed in to create an organization");
      setAlertSeverity("error");
      setShowAlert(true);
      router.push("/login");
      return;
    }

    try {
      console.log("Creating organization with token:", session.accessToken); // Updated to accessToken
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`, // Updated to accessToken
        },
        body: JSON.stringify({ name: orgName }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Organization created successfully!");
        setAlertSeverity("success");
        setShowAlert(true);
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setMessage(data.error || "Failed to create organization");
        setAlertSeverity("error");
        setShowAlert(true);
        console.error("Create organization failed:", res.status, data);
      }
    } catch (error) {
      setMessage("An error occurred");
      setAlertSeverity("error");
      setShowAlert(true);
      console.error("Error creating organization:", error);
    }
  };

  const handleSelectOrg = async (orgId: string) => {
    if (!session?.accessToken) { // Updated to accessToken
      setMessage("You must be signed in to join an organization");
      setAlertSeverity("error");
      setShowAlert(true);
      router.push("/login");
      return;
    }

    try {
      console.log("Joining organization with token:", session.accessToken, "orgId:", orgId); // Updated to accessToken
      const res = await fetch("/api/join-organization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`, // Updated to accessToken
        },
        body: JSON.stringify({ organizationId: orgId }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Joined organization successfully!");
        setAlertSeverity("success");
        setShowAlert(true);
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setMessage(data.error || "Failed to join organization");
        setAlertSeverity("error");
        setShowAlert(true);
        console.error("Join organization failed:", res.status, data);
      }
    } catch (error) {
      setMessage("An error occurred");
      setAlertSeverity("error");
      setShowAlert(true);
      console.error("Error joining organization:", error);
    }
  };

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-black/95 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/60 dark:bg-black/90 p-6 rounded-md border border-gray-400">
        {showAlert && (
          <Alert severity={alertSeverity} className="mb-4">
            {message}
          </Alert>
        )}
        <h1 className="text-3xl font-semibold dark:text-white text-black mb-4">
          Select or Create Organization
        </h1>

        <div className="mb-6">
          <h2 className="text-lg dark:text-white text-black mb-2">Create New Organization</h2>
          <Input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Enter organization name"
            className="dark:bg-slate-800 border-[1px] dark:text-white text-black border-black rounded-sm mb-2"
          />
          <Button
            onClick={handleCreateOrg}
            className="w-full dark:bg-purple-900 bg-purple-700 hover:bg-purple-800 text-white dark:hover:bg-purple-950"
          >
            Create Organization
          </Button>
        </div>

        <div>
          <h2 className="text-lg dark:text-white text-black mb-2">Join Existing Organization</h2>
          {orgs.length > 0 ? (
            orgs.map((org: { id: string; name: string }) => (
              <Button
                key={org.id}
                onClick={() => handleSelectOrg(org.id)}
                className="w-full mb-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {org.name}
              </Button>
            ))
          ) : (
            <p className="text-gray-500">No organizations available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectOrganization;