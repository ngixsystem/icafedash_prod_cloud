import { useQuery } from "@tanstack/react-query";

export interface PublicTournament {
  id: number;
  title: string;
  game: string;
  description: string;
  team_format: string;
  location: string;
  starts_at: string | null;
  check_in_at: string | null;
  status: string;
  format: string;
  max_teams: number;
  prize_pool: string;
  entry_fee: string;
  stream_url: string;
  faceit_championship_id: string;
  created_by_user_id: number;
  created_at: string | null;
  updated_at: string | null;
  registered_teams: number;
}

export interface TournamentMember {
  id: number;
  username: string;
  avatar_url: string;
  role_in_team: string;
  faceit_id: string | null;
  faceit_elo: number | null;
  faceit_level: number | null;
}

export interface PublicTournamentDetails extends PublicTournament {
  registrations: Array<{
    id: number;
    team_id: number;
    team_name: string;
    team_tag: string | null;
    team_logo_url: string;
    status: string;
    created_at: string | null;
    members: TournamentMember[];
  }>;
}

export const usePublicTournaments = () =>
  useQuery({
    queryKey: ["public_tournaments_club_finder"],
    queryFn: async (): Promise<PublicTournament[]> => {
      const resp = await fetch("/api/public/tournaments");
      if (!resp.ok) {
        throw new Error("Failed to fetch tournaments");
      }
      return resp.json();
    },
  });

export const usePublicTournamentDetails = (tournamentId: string | undefined) =>
  useQuery({
    queryKey: ["public_tournament_details_club_finder", tournamentId],
    queryFn: async (): Promise<PublicTournamentDetails> => {
      if (!tournamentId) {
        throw new Error("Tournament id is required");
      }
      const resp = await fetch(`/api/public/tournaments/${tournamentId}`);
      if (!resp.ok) {
        throw new Error("Failed to fetch tournament");
      }
      return resp.json();
    },
    enabled: !!tournamentId,
  });
