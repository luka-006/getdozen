"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function SiteHeaderLoader({
  waitlistLock,
}: {
  waitlistLock: boolean;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
      }
    })();
  }, []);

  return <SiteHeader profile={profile} waitlistLock={waitlistLock} />;
}
