// app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function Dashboard() {
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
