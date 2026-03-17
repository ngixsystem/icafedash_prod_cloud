import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Clock, Crosshair, Crown, Loader2,
  MapPin, Medal, MonitorPlay, ScrollText, Swords, Target, Timer, Trophy, Users, X, XCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import Markdown from "react-markdown";
import { usePublicTournamentDetails, type TournamentMember } from "@/hooks/use-tournaments";
import { FaceitLevelIcon } from "@/components/FaceitLevelIcon";

/* ── helpers ─────────────────────────────────────────────────── */

function formatDate(value: string | null) {
  if (!value) return "Не указано";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Не указано";
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatTeams(teamFormat: string, maxTeams: number) {
  const base = teamFormat?.trim() ? teamFormat.trim() : "Не указано";
  const teams = Number.isFinite(maxTeams) && maxTeams > 0 ? `${maxTeams} команд` : "0 команд";
  return `${base} • ${teams}`;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  approved: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  pending: { bg: "bg-amber-500/15", text: "text-amber-400" },
  rejected: { bg: "bg-red-500/15", text: "text-red-400" },
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Подтверждена",
  pending: "На рассмотрении",
  rejected: "Отклонена",
};

function getStreamEmbed(url: string): { type: "twitch" | "youtube"; embedUrl: string } | null {
  if (!url) return null;
  // YouTube: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/live/ID
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([\w-]{11})/);
  if (ytMatch) return { type: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };
  // Twitch: twitch.tv/channelName
  const twMatch = url.match(/twitch\.tv\/(\w+)/);
  if (twMatch) return { type: "twitch", embedUrl: `https://player.twitch.tv/?channel=${twMatch[1]}&parent=${window.location.hostname}` };
  return null;
}

/* ── Player profile modal (FACEIT stats) ─────────────────────── */

function PlayerModal({ member, onClose }: { member: TournamentMember; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["player_faceit_stats", member.id],
    queryFn: async () => {
      const resp = await fetch(`/api/public/players/${member.id}/faceit-stats`);
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
    enabled: !!member.faceit_id,
    staleTime: 5 * 60 * 1000,
  });

  const lifetime = data?.lifetime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#2F3136] bg-[#0e1015] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-white/5 bg-gradient-to-b from-[#FF7800]/5 to-transparent">
          <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF7800] to-[#FF5500] p-[2px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#0e1015] overflow-hidden flex items-center justify-center">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold uppercase text-white/60">{member.username[0]}</span>
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-display font-bold text-white truncate">{member.username}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {member.faceit_level != null && (
                  <FaceitLevelIcon level={member.faceit_level} elo={member.faceit_elo} size={20} />
                )}
                {member.faceit_elo != null && (
                  <span className="text-xs font-bold text-[#FF7800]">{member.faceit_elo} ELO</span>
                )}
                {!member.faceit_id && <span className="text-xs text-slate-500">FACEIT не привязан</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {!member.faceit_id ? (
            <p className="text-sm text-slate-500 text-center py-4">У игрока не привязан FACEIT аккаунт</p>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF7800]" />
            </div>
          ) : isError || !lifetime ? (
            <p className="text-sm text-slate-500 text-center py-4">Не удалось загрузить статистику</p>
          ) : (
            <>
              <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">CS2 Статистика</h4>
              <div className="grid grid-cols-2 gap-2">
                <StatCard icon={<Swords className="w-4 h-4" />} label="Матчей" value={lifetime.matches} color="#FF7800" />
                <StatCard icon={<Trophy className="w-4 h-4" />} label="Винрейт" value={`${lifetime.win_rate}%`} color="#22c55e" />
                <StatCard icon={<Crosshair className="w-4 h-4" />} label="K/D" value={lifetime.kd_ratio} color="#3b82f6" />
                <StatCard icon={<Target className="w-4 h-4" />} label="HS %" value={`${lifetime.headshots}%`} color="#a855f7" />
              </div>

              {data.maps?.length > 0 && (
                <>
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-4 mb-2">Топ карты</h4>
                  <div className="space-y-1.5">
                    {data.maps.slice(0, 3).map((m: any) => (
                      <div key={m.name} className="flex items-center justify-between rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 text-xs">
                        <span className="text-white font-medium">{m.name}</span>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>{m.matches} матчей</span>
                          <span className="text-emerald-400">{m.win_rate}% WR</span>
                          <span className="text-blue-400">{m.avg_kd} K/D</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-slate-500">{label}</p>
        <p className="text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

/* ── Team accordion ──────────────────────────────────────────── */

function TeamCard({ reg, onPlayerClick }: {
  reg: { team_name: string; team_tag: string | null; team_logo_url?: string; status: string; members: TournamentMember[] };
  onPlayerClick: (m: TournamentMember) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#25272B] bg-[#16181C] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#FF7800]/10 border border-[#FF7800]/20 flex items-center justify-center text-[11px] font-bold text-[#FF7800] shrink-0 overflow-hidden">
            {reg.team_logo_url ? (
              <img src={reg.team_logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              reg.team_tag?.slice(0, 3) || reg.team_name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {reg.team_name}
            </p>
            <p className="text-[11px] text-slate-500">{reg.members.length} участник(ов)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {reg.status === "approved" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : reg.status === "rejected" ? (
            <XCircle className="w-5 h-5 text-red-400" />
          ) : (
            <Clock className="w-4 h-4 text-amber-400" />
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {open && reg.members.length > 0 && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {reg.members.map((m) => (
            <button
              key={m.id}
              onClick={() => onPlayerClick(m)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold uppercase text-white/40">{m.username[0]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white truncate">{m.username}</span>
                  {m.role_in_team === "captain" && <Crown className="w-3.5 h-3.5 text-[#FF9A2F] shrink-0" />}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {m.faceit_level != null && <FaceitLevelIcon level={m.faceit_level} elo={m.faceit_elo} size={18} />}
                {m.faceit_elo != null && <span className="text-[11px] font-bold text-[#FF7800]">{m.faceit_elo}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && reg.members.length === 0 && (
        <div className="border-t border-white/5 px-4 py-3">
          <p className="text-xs text-slate-500 text-center">Нет участников</p>
        </div>
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────── */

export default function TournamentDetailsPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { data: selected, isLoading, isError } = usePublicTournamentDetails(tournamentId);
  const [selectedPlayer, setSelectedPlayer] = useState<TournamentMember | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen px-5 pt-7 pb-28">
        <Link to="/tournaments" className="inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
          <ArrowLeft className="h-4 w-4" /> Назад к турнирам
        </Link>
        <p className="mt-5 text-[#949BA4]">Загрузка турнира...</p>
      </div>
    );
  }

  if (isError || !selected) {
    return (
      <div className="min-h-screen px-5 pt-7 pb-28">
        <Link to="/tournaments" className="inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
          <ArrowLeft className="h-4 w-4" /> Назад к турнирам
        </Link>
        <p className="mt-5 text-[#949BA4]">Турнир не найден.</p>
      </div>
    );
  }

  const regs = selected.registrations || [];

  return (
    <div className="min-h-screen px-5 pt-7 pb-28">
      <Link to="/tournaments" className="mb-4 inline-flex items-center gap-2 text-sm text-[#C4CAD2]">
        <ArrowLeft className="h-4 w-4" /> Назад
      </Link>

      {/* Title card */}
      <div className="mb-5 rounded-2xl border border-[#2F3136] bg-[linear-gradient(145deg,#1A1B1F_0%,#101010_100%)] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#949BA4]">Турнир</span>
            <h1 className="mt-1 font-display text-[32px] leading-none text-white">{selected.title}</h1>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#3a2a12] bg-[#2a1b08] px-2.5 py-1 text-[10px] font-semibold uppercase text-[#FF9A2F]">
            <Medal className="h-3 w-3" />
            {selected.prize_pool || "Приз не указан"}
          </span>
        </div>
        {(() => {
          const desc = selected.description || "Описание пока не добавлено.";
          const isLong = desc.length > 150;
          const shown = !descExpanded && isLong ? desc.slice(0, 150) + "…" : desc;
          return (
            <>
              <div className={`text-sm leading-relaxed text-[#B5BAC1] prose prose-invert prose-sm max-w-none ${!descExpanded && isLong ? "line-clamp-4" : ""}`}>
                <Markdown>{shown}</Markdown>
              </div>
              {isLong && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-2 text-xs text-[#FF7800] font-medium hover:underline"
                >
                  {descExpanded ? "Свернуть" : "Читать дальше"}
                </button>
              )}
            </>
          );
        })()}
      </div>

      {/* Info */}
      <section className="mb-4 rounded-2xl border border-[#2F3136] bg-[#121315] p-4">
        <h2 className="mb-3 font-display text-[24px] leading-none">Информация</h2>
        <div className="space-y-2.5 text-sm text-[#B5BAC1]">
          <InfoRow icon={<CalendarDays className="h-4 w-4 text-[#FF7800]" />} label="Дата" value={formatDate(selected.starts_at)} />
          <InfoRow icon={<Users className="h-4 w-4 text-[#FF7800]" />} label="Формат" value={formatTeams(selected.team_format, selected.max_teams)} />
          <InfoRow icon={<MapPin className="h-4 w-4 text-[#FF7800]" />} label="Локация" value={selected.location || "Не указано"} />
          <InfoRow icon={<Trophy className="h-4 w-4 text-[#FF7800]" />} label="Дисциплина" value={selected.game || "Не указано"} />
          <InfoRow icon={<Timer className="h-4 w-4 text-[#FF7800]" />} label="Check-in" value={formatDate(selected.check_in_at)} />
          <InfoRow icon={<Medal className="h-4 w-4 text-[#FF7800]" />} label="Взнос" value={selected.entry_fee || "Не указано"} />
          <InfoRow icon={<ScrollText className="h-4 w-4 text-[#FF7800]" />} label="Сетка" value={selected.format || "Не указано"} />
        </div>
      </section>

      {/* Stream */}
      {selected.stream_url && (() => {
        const embed = getStreamEmbed(selected.stream_url);
        return (
          <section className="mb-4 rounded-2xl border border-[#2F3136] bg-[#121315] p-4">
            <h2 className="mb-3 font-display text-[24px] leading-none flex items-center gap-2">
              <MonitorPlay className="h-5 w-5 text-[#FF7800]" /> Трансляция
            </h2>
            {embed ? (
              <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={embed.embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Stream"
                />
              </div>
            ) : (
              <a
                href={selected.stream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#FF7800]/20 bg-[#FF7800]/10 px-4 py-3 text-sm font-medium text-[#FF7800] hover:bg-[#FF7800]/15 transition-colors"
              >
                <MonitorPlay className="h-4 w-4" />
                Смотреть трансляцию
              </a>
            )}
          </section>
        );
      })()}

      {/* Registered teams */}
      <section className="rounded-2xl border border-[#2F3136] bg-[#121315] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[24px] leading-none">Команды</h2>
          <span className="text-sm text-[#FF7800] font-bold">{regs.length}/{selected.max_teams}</span>
        </div>

        {regs.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Пока нет зарегистрированных команд</p>
        ) : (
          <div className="space-y-2">
            {regs.map((reg) => (
              <TeamCard key={reg.id} reg={reg} onPlayerClick={setSelectedPlayer} />
            ))}
          </div>
        )}
      </section>

      {/* Player modal */}
      {selectedPlayer && <PlayerModal member={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#25272B] bg-[#16181C] px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="shrink-0 text-[#949BA4]">{label}</span>
      </div>
      <span className="truncate text-right text-white">{value}</span>
    </div>
  );
}
