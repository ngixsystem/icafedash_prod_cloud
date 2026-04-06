import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL ?? "";

export interface CyberUnionTeam {
  id: number;
  name: string;
  points: number;
  photo: string;
  region: string;
  region_photo: string;
}

export interface CyberUnionPlayer {
  id: number;
  name: string;
  nickname: string;
  points: number;
  photo: string;
  team: string | null;
  region: string;
  region_photo: string;
}

export interface CyberUnionResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_count: number;
}

export function useCyberUnionTeams(game: string, page: number) {
  return useQuery<CyberUnionResponse<CyberUnionTeam>>({
    queryKey: ["cu_teams", game, page],
    queryFn: async () => {
      const resp = await fetch(`${API}/public/cyberunion/teams?game=${game}&page=${page}&per_page=20`);
      if (!resp.ok) throw new Error("Failed to fetch teams");
      return resp.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCyberUnionPlayers(game: string, page: number) {
  return useQuery<CyberUnionResponse<CyberUnionPlayer>>({
    queryKey: ["cu_players", game, page],
    queryFn: async () => {
      const resp = await fetch(`${API}/public/cyberunion/players?game=${game}&page=${page}&per_page=20`);
      if (!resp.ok) throw new Error("Failed to fetch players");
      return resp.json();
    },
    staleTime: 2 * 60 * 1000,
  });
}

export interface CyberUnionTeamPlayer {
  id: number;
  name: string;
  nickname: string;
  points: number;
  photo: string;
}

export function useCyberUnionTeamPlayers(teamId: number | null) {
  return useQuery<{ items: CyberUnionTeamPlayer[] }>({
    queryKey: ["cu_team_players", teamId],
    queryFn: async () => {
      const resp = await fetch(`${API}/public/cyberunion/team-players?team_id=${teamId}`);
      if (!resp.ok) throw new Error("Failed to fetch team players");
      return resp.json();
    },
    enabled: teamId !== null,
    staleTime: 5 * 60 * 1000,
  });
}
