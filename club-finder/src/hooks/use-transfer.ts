import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TransferPlayer {
  id: number;
  username: string;
  avatar_url: string;
  faceit_elo: number | null;
  faceit_level: number | null;
  team_name: string | null;
}

export interface TransferListing {
  id: number;
  listing_type: "lft" | "lfs";
  game: string;
  roles: string | null;
  description: string | null;
  region: string | null;
  min_elo: number | null;
  max_elo: number | null;
  contact: string | null;
  created_at: string;
  expires_at: string | null;
  player: TransferPlayer;
}

export interface TransferListResponse {
  total: number;
  items: TransferListing[];
}

export interface PlayerProfile {
  id: number;
  username: string;
  avatar_url: string;
  faceit_id: string | null;
  faceit_elo: number | null;
  faceit_level: number | null;
  member_since: string | null;
  team: {
    id: number;
    name: string;
    tag: string | null;
    logo_url: string;
    role_in_team: string;
  } | null;
  tournaments: {
    id: number;
    title: string;
    game: string;
    status: string;
    starts_at: string | null;
    logo_url: string;
  }[];
  transfer_listing: {
    id: number;
    listing_type: string;
    game: string;
    roles: string | null;
    description: string | null;
    region: string | null;
    contact: string | null;
  } | null;
}

export interface CreateListingPayload {
  listing_type: "lft" | "lfs";
  game: string;
  roles?: string;
  description?: string;
  region?: string;
  min_elo?: number | null;
  max_elo?: number | null;
  contact?: string;
  expires_days?: number;
}

const API = import.meta.env.VITE_API_URL ?? "";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ─── Queries ───────────────────────────────────────

export function useTransferListings(params: {
  game?: string;
  type?: string;
  region?: string;
  min_elo?: number | null;
  max_elo?: number | null;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params.game) search.set("game", params.game);
  if (params.type) search.set("type", params.type);
  if (params.region) search.set("region", params.region);
  if (params.min_elo != null) search.set("min_elo", String(params.min_elo));
  if (params.max_elo != null) search.set("max_elo", String(params.max_elo));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.offset) search.set("offset", String(params.offset));

  return useQuery<TransferListResponse>({
    queryKey: ["transfer_listings", params],
    queryFn: async () => {
      const resp = await fetch(`${API}/api/public/transfer?${search.toString()}`);
      if (!resp.ok) throw new Error("Failed to fetch transfer listings");
      return resp.json();
    },
    staleTime: 60 * 1000,
  });
}

export function usePlayerProfile(userId: number | null) {
  return useQuery<PlayerProfile>({
    queryKey: ["player_profile", userId],
    queryFn: async () => {
      const resp = await fetch(`${API}/api/public/players/${userId}`);
      if (!resp.ok) throw new Error("Player not found");
      return resp.json();
    },
    enabled: userId != null,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Mutations ─────────────────────────────────────

export function useCreateListing(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateListingPayload) => {
      const resp = await fetch(`${API}/api/public/transfer`, {
        method: "POST",
        headers: authHeaders(token!),
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message ?? "Failed to create listing");
      }
      return resp.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfer_listings"] }),
  });
}

export function useDeleteListing(token: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: number) => {
      const resp = await fetch(`${API}/api/public/transfer/${listingId}`, {
        method: "DELETE",
        headers: authHeaders(token!),
      });
      if (!resp.ok) throw new Error("Failed to delete listing");
      return resp.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfer_listings"] }),
  });
}
