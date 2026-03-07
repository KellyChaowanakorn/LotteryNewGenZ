import { useEffect } from "react";
import { useUser } from "@/lib/store";

/**
 * ★ useHeartbeat — ส่ง ping ไป server ทุก 30 วินาที
 * เพื่อให้ admin เห็นว่า user อยู่ออนไลน์หรือไม่
 * ใส่ไว้ใน App.tsx หรือ Layout component
 */
export function useHeartbeat() {
  const { user, isAuthenticated } = useUser();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch {
        // Silent fail — don't break app if heartbeat fails
      }
    };

    // Send immediately on mount
    sendHeartbeat();

    // Then every 30 seconds
    const interval = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);
}
