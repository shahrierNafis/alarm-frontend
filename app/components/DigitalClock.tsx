"use client";

import { useEffect, useState } from "react";

export default function DigitalClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    // Set initial time
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setTime(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();

    // Update time every 100ms for smooth updates
    const interval = setInterval(updateTime, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-9xl font-bold text-black dark:text-white font-mono tracking-wider">{time || "00:00:00"}</div>
  );
}
