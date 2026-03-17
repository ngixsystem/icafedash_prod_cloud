import { useQuery } from "@tanstack/react-query";

export interface FaceitLifetimeStats {
  matches: string;
  wins: string;
  win_rate: string;
  kd_ratio: string;
  headshots: string;
  longest_win_streak: string;
  current_win_streak: string;
}

export interface FaceitMapStats {
  name: string;
  img_regular: string;
  matches: string;
  wins: string;
  win_rate: string;
  avg_kills: string;
  avg_deaths: string;
  avg_kd: string;
  avg_headshots: string;
}

export interface FaceitStatsPayload {
  lifetime: FaceitLifetimeStats;
  maps: FaceitMapStats[];
}

export interface FaceitMatchPlayerStats {
  kills: string;
  deaths: string;
  assists: string;
  kd: string;
  headshots_pct: string;
  mvps: string;
}

export interface FaceitMatch {
  match_id: string;
  map: string | null;
  started_at: number | null;
  finished_at: number | null;
  is_win: boolean | null;
  score: string;
  team_name: string;
  opponent_name: string;
  stats: FaceitMatchPlayerStats | null;
}

export interface FaceitHistoryPayload {
  matches: FaceitMatch[];
}

export const useFaceitStats = (token: string | null) =>
  useQuery({
    queryKey: ["faceit_stats"],
    queryFn: async (): Promise<FaceitStatsPayload> => {
      const resp = await fetch("/api/public/profile/faceit/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed to fetch FACEIT stats");
      return resp.json();
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

export const useFaceitHistory = (token: string | null, limit = 20) =>
  useQuery({
    queryKey: ["faceit_history", limit],
    queryFn: async (): Promise<FaceitHistoryPayload> => {
      const resp = await fetch(`/api/public/profile/faceit/history?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed to fetch FACEIT history");
      return resp.json();
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });
