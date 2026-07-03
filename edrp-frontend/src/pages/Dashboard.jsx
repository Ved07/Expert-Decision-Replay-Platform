import { useState, useEffect } from "react";
import { getCurrentUser, logout } from "../services/api";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await getCurrentUser();
        setUser(data);
      } catch (err) {
        setError("Could not load profile. Please log in again.");
      }
    }

    fetchUser();
  }, []);

  function handleLogout() {
    logout();
    window.location.href = "/login"; // simplest way to redirect for now
  }

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h2>Welcome, {user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}

export default Dashboard;