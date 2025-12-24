"use client";

import { useEffect } from "react";
import { useSystemConfigStore } from "@/store/useSystemConfigStore";
import { useRouter } from "next/navigation";

export default function Home() {
  const { config, fetchSystemConfig } = useSystemConfigStore();
  const router = useRouter();
  useEffect(() => {
    fetchSystemConfig();
    router.push("/Dashboard");
  }, []);

  return (
    <div>
    </div>
  );
}
