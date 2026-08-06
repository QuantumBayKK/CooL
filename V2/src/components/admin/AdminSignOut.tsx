"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminSignOut() {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
    >
      <LogOut className="size-3.5" strokeWidth={2} />
      Sign out
    </Button>
  );
}
