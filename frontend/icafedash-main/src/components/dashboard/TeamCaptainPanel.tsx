import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";

export default function TeamCaptainPanel() {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");

  const teamQuery = useQuery({ queryKey: ["captain_team_me"], queryFn: api.captainTeamMe });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["captain_team_me"] });

  const addMutation = useMutation({
    mutationFn: () => api.captainAddTeamMember(username),
    onSuccess: () => {
      toast.success("Player added");
      setUsername("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add player"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => api.captainRemoveTeamMember(userId),
    onSuccess: () => {
      toast.success("Player removed");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove player"),
  });

  if (teamQuery.isLoading) {
    return <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-400">Loading team...</div>;
  }

  if (teamQuery.isError || !teamQuery.data) {
    return <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-400">Captain team not found. Ask admin to assign captain role and team.</div>;
  }

  const team = teamQuery.data.team;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-[#6C5CE7]" />
          <h2 className="font-display text-2xl">Captain panel</h2>
        </div>
        <p className="text-sm text-slate-300">
          Team: <span className="font-semibold text-white">{team.name}</span> {team.tag ? <span className="text-slate-400">[{team.tag}]</span> : null}
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-[#00E5FF]" /> Add player
        </h3>
        <div className="flex gap-2">
          <input className="h-10 flex-1 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button className="h-10 px-3 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF]" onClick={() => addMutation.mutate()} disabled={!username.trim() || addMutation.isPending}>
            Add
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#58d68d]" /> Roster
        </h3>
        <div className="space-y-2">
          {teamQuery.data.members.map((member) => (
            <div key={member.user_id} className="rounded-lg border border-white/10 bg-black/25 p-2.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-white">{member.username}</p>
                <p className="text-[11px] text-slate-400">{member.role_in_team}</p>
              </div>
              {member.role_in_team !== "captain" ? (
                <button className="text-xs rounded-md border border-rose-400/40 bg-rose-400/10 px-2 py-1 text-rose-300" onClick={() => removeMutation.mutate(member.user_id)}>
                  remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
