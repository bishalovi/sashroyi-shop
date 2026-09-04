"use client";

import { useEffect, useState } from "react";
import ModeratorActivityCard from "./ModeratorActivityCard";
import ModeratorPerformanceCard from "./ModeratorPerformanceCard";

export default function ModeratorSectionForAdmin() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("barakahUser") || "{}");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(user);
  }, []);

  if (user?.role !== "barakahAdmin1234") return null;

  return (
    <div className="flex flex-col md:flex-row gap-4 col-span-1 md:col-span-2">
      <div className="w-full md:w-[50%]">
        <ModeratorActivityCard />
      </div>

      <div className="w-full md:w-[50%]">
        <ModeratorPerformanceCard />
      </div>
    </div>
  );
}
