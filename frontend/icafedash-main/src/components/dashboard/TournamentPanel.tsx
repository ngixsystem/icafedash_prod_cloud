import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Medal, ShieldCheck, Swords } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";

function fmtDate(value: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TournamentPanel() {
  const { isAdmin, isCaptain } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createData, setCreateData] = useState({
    title: "",
    game: "CS2",
    team_format: "",
    location: "",
    starts_at: "",
    check_in_at: "",
    entry_fee: "",
    format: "",
    prize_pool: "",
    max_teams: 16,
  });

  const tournamentsQuery = useQuery({ queryKey: ["public_tournaments"], queryFn: api.publicTournaments });

  const selectedFromList = useMemo(() => {
    if (!tournamentsQuery.data || tournamentsQuery.data.length === 0) return null;
    if (selectedId) return tournamentsQuery.data.find((x) => x.id === selectedId) || tournamentsQuery.data[0];
    return tournamentsQuery.data[0];
  }, [selectedId, tournamentsQuery.data]);

  const detailsQuery = useQuery({
    queryKey: ["tournament_details", selectedFromList?.id],
    queryFn: () => api.publicTournamentDetails(selectedFromList!.id),
    enabled: !!selectedFromList?.id,
  });

  const bracketQuery = useQuery({
    queryKey: ["tournament_bracket", selectedFromList?.id],
    queryFn: () => api.publicTournamentBracket(selectedFromList!.id),
    enabled: !!selectedFromList?.id,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["public_tournaments"] });
    if (selectedFromList?.id) {
      queryClient.invalidateQueries({ queryKey: ["tournament_details", selectedFromList.id] });
      queryClient.invalidateQueries({ queryKey: ["tournament_bracket", selectedFromList.id] });
    }
  };

  const createMutation = useMutation({
    mutationFn: () =>
      api.createTournament({
        title: createData.title,
        game: createData.game,
        team_format: createData.team_format,
        location: createData.location,
        starts_at: createData.starts_at,
        check_in_at: createData.check_in_at,
        entry_fee: createData.entry_fee,
        format: createData.format,
        prize_pool: createData.prize_pool,
        max_teams: Number(createData.max_teams),
        status: "open",
      }),
    onSuccess: () => {
      toast.success("Tournament created");
      setCreateData({
        title: "",
        game: "CS2",
        team_format: "",
        location: "",
        starts_at: "",
        check_in_at: "",
        entry_fee: "",
        format: "",
        prize_pool: "",
        max_teams: 16,
      });
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create tournament"),
  });

  const registerMutation = useMutation({
    mutationFn: (id: number) => api.captainRegisterTournament(id),
    onSuccess: () => {
      toast.success("Team registration request sent");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to register team"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ tournamentId, registrationId }: { tournamentId: number; registrationId: number }) =>
      api.approveTournamentRegistration(tournamentId, registrationId),
    onSuccess: () => {
      toast.success("Registration approved");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to approve registration"),
  });

  const generateBracketMutation = useMutation({
    mutationFn: (tournamentId: number) => api.generateTournamentBracket(tournamentId),
    onSuccess: () => {
      toast.success("Bracket generated");
      refreshAll();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to generate bracket"),
  });

  const isCreateDisabled =
    createMutation.isPending ||
    !createData.title.trim() ||
    !createData.game.trim() ||
    !createData.team_format.trim() ||
    !createData.location.trim() ||
    !createData.starts_at.trim() ||
    !createData.check_in_at.trim() ||
    !createData.entry_fee.trim() ||
    !createData.format.trim();

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <h2 className="font-display text-2xl mb-4 text-white">Tournament management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Title" value={createData.title} onChange={(e) => setCreateData((p) => ({ ...p, title: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Game" value={createData.game} onChange={(e) => setCreateData((p) => ({ ...p, game: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Format (2v2 • 24 teams)" value={createData.team_format} onChange={(e) => setCreateData((p) => ({ ...p, team_format: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Location" value={createData.location} onChange={(e) => setCreateData((p) => ({ ...p, location: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" type="datetime-local" placeholder="Start date" value={createData.starts_at} onChange={(e) => setCreateData((p) => ({ ...p, starts_at: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" type="datetime-local" placeholder="Check-in date" value={createData.check_in_at} onChange={(e) => setCreateData((p) => ({ ...p, check_in_at: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Entry fee" value={createData.entry_fee} onChange={(e) => setCreateData((p) => ({ ...p, entry_fee: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Bracket (Groups + Playoff, BO3)" value={createData.format} onChange={(e) => setCreateData((p) => ({ ...p, format: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Prize pool" value={createData.prize_pool} onChange={(e) => setCreateData((p) => ({ ...p, prize_pool: e.target.value }))} />
            <input className="h-11 rounded-xl bg-white/5 border border-white/10 px-3" type="number" min={2} placeholder="Teams" value={createData.max_teams} onChange={(e) => setCreateData((p) => ({ ...p, max_teams: Number(e.target.value || 2) }))} />
          </div>
          <button className="mt-3 h-10 px-4 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-[#00E5FF]" onClick={() => createMutation.mutate()} disabled={isCreateDisabled}>
            Create tournament
          </button>
        </section>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-4">
        <section className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <h3 className="font-display text-xl mb-3">Tournaments</h3>
          <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
            {(tournamentsQuery.data || []).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left rounded-xl border px-3 py-2 transition ${selectedFromList?.id === item.id ? "border-[#00E5FF]/50 bg-[#00E5FF]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white truncate">{item.title}</p>
                  <span className="text-[10px] uppercase text-slate-400">{item.status}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{item.game} • {item.registered_teams}/{item.max_teams}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
          {!selectedFromList ? (
            <p className="text-slate-400">No tournaments yet</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display text-3xl leading-none text-white">{selectedFromList.title}</h3>
                  <p className="text-sm text-slate-400 mt-2">{selectedFromList.game} • {selectedFromList.location || "Location not set"}</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#2f2f2f] bg-black/40 px-3 py-1.5 text-xs text-[#FF9A2F]">
                  <Medal className="w-3.5 h-3.5" /> {selectedFromList.prize_pool || "Prize pool not set"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Start</p>
                  <p className="text-sm font-semibold">{fmtDate(selectedFromList.starts_at)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Team format</p>
                  <p className="text-sm font-semibold">{selectedFromList.team_format || "-"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Check-in</p>
                  <p className="text-sm font-semibold">{fmtDate(selectedFromList.check_in_at)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-400">Bracket</p>
                  <p className="text-sm font-semibold">{selectedFromList.format}</p>
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-400">Entry fee</p>
                <p className="text-sm font-semibold">{selectedFromList.entry_fee || "-"}</p>
              </div>

              {isCaptain ? (
                <button className="h-10 px-4 rounded-xl bg-[#6C5CE7]/20 border border-[#6C5CE7]/40 text-[#c7bbff] mb-4" onClick={() => registerMutation.mutate(selectedFromList.id)} disabled={registerMutation.isPending}>
                  Register my team
                </button>
              ) : null}

              {isAdmin && selectedFromList ? (
                <button className="h-10 px-4 rounded-xl bg-[#00E5FF]/12 border border-[#00E5FF]/40 text-[#00E5FF] mb-4 ml-2" onClick={() => generateBracketMutation.mutate(selectedFromList.id)} disabled={generateBracketMutation.isPending}>
                  Generate bracket
                </button>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-xl border border-white/10 bg-[#0c1020]/55 p-3">
                  <h4 className="font-semibold flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-[#00E5FF]" /> Registrations</h4>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {(detailsQuery.data?.registrations || []).map((reg) => (
                      <div key={reg.id} className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-white">{reg.team_name}</p>
                            <p className="text-[11px] text-slate-400">{reg.status} • {fmtDate(reg.created_at)}</p>
                          </div>
                          {isAdmin && reg.status === "pending" ? (
                            <button className="text-xs rounded-md border border-[#58d68d]/40 bg-[#58d68d]/10 px-2 py-1 text-[#58d68d]" onClick={() => approveMutation.mutate({ tournamentId: selectedFromList.id, registrationId: reg.id })}>
                              approve
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0c1020]/55 p-3">
                  <h4 className="font-semibold flex items-center gap-2 mb-3"><Swords className="w-4 h-4 text-[#6C5CE7]" /> Bracket</h4>
                  <div className="space-y-2 max-h-64 overflow-auto pr-1">
                    {(bracketQuery.data?.matches || []).length === 0 ? (
                      <p className="text-sm text-slate-400">Bracket not generated yet</p>
                    ) : (
                      (bracketQuery.data?.matches || []).map((match) => (
                        <div key={match.id} className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                          <p className="text-[11px] text-slate-400 mb-1">Round {match.round_number} • Match {match.match_order}</p>
                          <p className="text-sm text-white">{match.team1_name || "TBD"} vs {match.team2_name || "TBD"}</p>
                          <p className="text-[11px] text-[#58d68d]">Winner: {match.winner_team_name || "-"}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
