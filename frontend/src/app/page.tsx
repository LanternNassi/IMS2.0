"use client";

import { useEffect } from "react";
import { useSystemConfigStore } from "@/store/useSystemConfigStore";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/store/useOrgStore";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const { config, fetchSystemConfig } = useSystemConfigStore();
  const router = useRouter();
  const currentUser = useAuthStore.getState().user
  useEffect(() => {
    fetchSystemConfig();
    if (currentUser?.role === "admin") {
      router.push("/Dashboard");
    } else {
      router.push("/Sales");
    }
  }, []);

  return (
    <div>
    </div>
  );
}
