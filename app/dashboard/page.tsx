import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import DashboardClient from "./DashboardClient";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // If no session, redirect to login (server-side redirect)
    return (
      <div>
        <p>You are not logged in. Please sign in.</p>
      </div>
    );
  }

  return <DashboardClient session={session} />;
}
