import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, Users } from "lucide-react";
import { api } from "@/lib/api";

export default function UserPrivilegesPanel() {
  const queryClient = useQueryClient();
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number | "">("");
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");

  const usersQuery = useQuery({ queryKey: ["admin_users"], queryFn: api.adminUsers });
  const teamsQuery = useQuery({ queryKey: ["admin_teams"], queryFn: api.adminTeams });

  const membersOnly = useMemo(() => (usersQuery.data || []).filter((u) => u.role !== "admin"), [usersQuery.data]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    queryClient.invalidateQueries({ queryKey: ["admin_teams"] });
  };

  const createTeamMutation = useMutation({
    mutationFn: () => api.createTeam({ name: teamName, tag: teamTag || undefined }),
    onSuccess: () => {
      toast.success("Team created");
      setTeamName("");
      setTeamTag("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create team"),
  });

  const assignCaptainMutation = useMutation({
    mutationFn: () => api.assignCaptain(Number(selectedTeamId), Number(selectedUserId)),
    onSuccess: () => {
      toast.success("Captain assigned");
      refresh();
    },
    onError: (e: any) => toast.error(e?.message || "Failed to assign captain"),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h2 className="font-display text-2xl mb-3">Teams and privileges</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="h-10 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          <input className="h-10 rounded-xl bg-white/5 border border-white/10 px-3" placeholder="Tag (optional)" value={teamTag} onChange={(e) => setTeamTag(e.target.value)} />
          <button className="h-10 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 text-[#00E5FF]" onClick={() => createTeamMutation.mutate()} disabled={!teamName.trim() || createTeamMutation.isPending}>
            Create team
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-[#FF9A2F]" /> Assign captain
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select className="h-10 rounded-xl bg-white/5 border border-white/10 px-3" value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : "") }>
            <option value="">Select team</option>
            {(teamsQuery.data || []).map((team) => (
              <option value={team.id} key={team.id}>{team.name}</option>
            ))}
          </select>
          <select className="h-10 rounded-xl bg-white/5 border border-white/10 px-3" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : "") }>
            <option value="">Select user</option>
            {membersOnly.map((user) => (
              <option value={user.id} key={user.id}>{user.username} ({user.role})</option>
            ))}
          </select>
          <button className="h-10 rounded-xl border border-[#FF9A2F]/40 bg-[#FF9A2F]/10 text-[#FF9A2F]" onClick={() => assignCaptainMutation.mutate()} disabled={!selectedTeamId || !selectedUserId || assignCaptainMutation.isPending}>
            Assign
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="font-semibold flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#58d68d]" /> Current teams
        </h3>
        <div className="space-y-2">
          {(teamsQuery.data || []).map((team) => (
            <div key={team.id} className="rounded-lg border border-white/10 bg-black/25 p-2.5 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-white">{team.name} {team.tag ? `[${team.tag}]` : ""}</p>
                <p className="text-[11px] text-slate-400">captain: {team.captain_username || "not assigned"} • members: {team.members_count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
