"use client";

import { useState } from "react";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";
import type { User } from "@/lib/client";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} setUser={setUser} />;
}
