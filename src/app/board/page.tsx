import { BoardView, parseTrack } from "@/components/board-view";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile, RequestRow } from "@/lib/types";

type Props = {
  searchParams: Promise<{
    type?: string;
    error?: string;
    platform?: string;
    focus?: string;
  }>;
};

export default async function BoardPage({ searchParams }: Props) {
  const me = await requireProfile();
  const params = await searchParams;
  const type = parseTrack(params.type ?? null);

  const supabase = await createClient();

  const [{ data: requests }, { data: myCommitments }] = await Promise.all([
    supabase
      .from("requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    supabase
      .from("tester_commitments")
      .select("request_id, opted_in_at, status, duration_days")
      .eq("tester_id", me.id),
  ]);

  const rows = (requests ?? []) as RequestRow[];
  const userIds = [...new Set(rows.map((r) => r.user_id))];

  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, is_pro, is_ramped, rating_avg, rating_count, reviews_given",
        )
        .in("id", userIds)
    : {
        data: [] as Pick<
          Profile,
          | "id"
          | "display_name"
          | "avatar_url"
          | "is_pro"
          | "is_ramped"
          | "rating_avg"
          | "rating_count"
          | "reviews_given"
        >[],
      };

  return (
    <BoardView
      meId={me.id}
      requests={rows}
      profiles={profiles ?? []}
      commitments={myCommitments ?? []}
      initialType={type}
      initialFocus={params.focus}
      initialPlatform={params.platform}
      error={params.error}
    />
  );
}
