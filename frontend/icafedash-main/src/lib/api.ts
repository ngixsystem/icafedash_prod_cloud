/**
 * iCafe Dashboard — API service layer
 * All components import from here instead of calling fetch() directly.
 */

const BASE = import.meta.env.VITE_API_URL ?? "/api";

function getHeaders() {
    const token = localStorage.getItem("icafe_token");
    const headers: Record<string, string> = {
        "Accept": "application/json"
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

async function toApiError(res: Response): Promise<Error> {
    try {
        const payload = await res.json();
        const message = payload?.message || payload?.error;
        if (message) return new Error(String(message));
    } catch {
        // Ignore JSON parsing errors and fallback to status text.
    }
    return new Error(`API error ${res.status}`);
}

async function get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${BASE}${path}`, window.location.origin);
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }
    const res = await fetch(url.toString(), {
        headers: getHeaders()
    });
    if (res.status === 401) {
        localStorage.removeItem("icafe_token");
        localStorage.removeItem("icafe_user");
        window.location.href = "/login";
    }
    if (!res.ok) throw await toApiError(res);
    return res.json();
}

async function post<T>(path: string, body: object): Promise<T> {
    const url = new URL(`${BASE}${path}`, window.location.origin);
    const headers = getHeaders();
    headers["Content-Type"] = "application/json";

    const res = await fetch(url.toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });
    if (res.status === 401) {
        localStorage.removeItem("icafe_token");
        localStorage.removeItem("icafe_user");
        window.location.href = "/login";
    }
    if (!res.ok) throw await toApiError(res);
    return res.json();
}

async function put<T>(path: string, body: object): Promise<T> {
    const url = new URL(`${BASE}${path}`, window.location.origin);
    const headers = getHeaders();
    headers["Content-Type"] = "application/json";
    const res = await fetch(url.toString(), {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
    });
    if (res.status === 401) {
        localStorage.removeItem("icafe_token");
        localStorage.removeItem("icafe_user");
        window.location.href = "/login";
    }
    if (!res.ok) throw await toApiError(res);
    return res.json();
}

async function del<T>(path: string): Promise<T> {
    const url = new URL(`${BASE}${path}`, window.location.origin);
    const res = await fetch(url.toString(), {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (res.status === 401) {
        localStorage.removeItem("icafe_token");
        localStorage.removeItem("icafe_user");
        window.location.href = "/login";
    }
    if (!res.ok) throw await toApiError(res);
    return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface OverviewData {
    today_revenue: number;
    week_revenue: number;
    total_members: number;
    new_members_week?: number;
    active_pcs: number;
    total_pcs: number;
    pc_load_percent: number;
    payment_methods: { name: string; amount: number }[];
    api_connected: boolean;
}

export interface DailyChartData {
    days: { day: string; date: string; value: number }[];
    total: number;
}

export interface MonthlyChartData {
    points: { date: string; cash: number; balance: number }[];
    total_cash: number;
    total_balance: number;
}

export interface PaymentMethodsData {
    methods: { name: string; amount: number; percent: number }[];
}

export interface PC {
    id: number | string;
    name: string;
    status: "free" | "busy" | "offline";
    member: string;
    time_left: string;
    room: string;
    top?: number;
    left?: number;
}

export interface Member {
    id: number;
    account: string;
    name: string;
    balance: number;
    balance_bonus: number;
    points: number;
    group: string;
    is_active: boolean;
    is_logined: boolean;
    expire: string;
    created: string;
}

export interface ConfigData {
    cafe_id: string;
    api_key_masked: string;
    configured: boolean;
    club_name: string;
    club_logo_url: string;
    club_main_photo_url: string;
    club_photos: string;
    address: string;
    telegram_username: string;
    lat: number | null;
    lng: number | null;
    working_hours: string;
    zones: string;
    tariffs: string;
    internet_speed: string;
}

export interface RegisteredUser {
    id: number;
    username: string;
    email: string;
    phone: string;
    role: string;
    is_verified: boolean;
    club_id: number | null;
    club_name: string | null;
    created_at: string | null;
}

export interface DashboardReview {
    id: number;
    club_id: number;
    club_name: string;
    user_id: number;
    username: string;
    rating: number;
    text: string;
    created_at: string | null;
}

export interface DashboardBooking {
    id: number;
    club_id: number;
    club_name: string;
    user_id: number;
    username: string;
    client_name: string;
    phone: string;
    zone_name: string;
    duration: string | null;
    pc_names: string[];
    status: string;
    cancellation_reason?: string | null;
    canceled_by?: string | null;
    canceled_at?: string | null;
    created_at: string | null;
}

export interface BookingPcOption {
    id: number | string;
    name: string;
    status: "free" | "busy" | "offline";
    member: string;
    time_left: string;
    room: string;
}

export interface CashbackConfig {
    club_id: number;
    cashback_enabled: boolean;
    cashback_percent: number;
}

export interface CashbackTransaction {
    id: number;
    club_id: number;
    manager_user_id: number;
    member_id: number | null;
    member_account: string | null;
    amount: number;
    cashback_percent: number;
    cashback_amount: number;
    note: string;
    created_at: string | null;
}

export interface Tournament {
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
    created_by_user_id: number;
    created_at: string | null;
    updated_at: string | null;
    registered_teams: number;
}

export interface Team {
    id: number;
    name: string;
    tag: string;
    logo_url: string;
    captain_user_id: number | null;
    captain_username: string | null;
    created_by_user_id: number;
    is_active: boolean;
    created_at: string | null;
    members_count: number;
}

export interface TeamMember {
    user_id: number;
    username: string;
    avatar_url: string;
    email: string;
    role_in_team: string;
    faceit_elo: number | null;
    faceit_level: number | null;
}

export interface TournamentMatch {
    id: number;
    round_number: number;
    match_order: number;
    team1_id: number | null;
    team1_name: string | null;
    team2_id: number | null;
    team2_name: string | null;
    winner_team_id: number | null;
    winner_team_name: string | null;
    status: string;
    score: string | null;
    scheduled_at: string | null;
}

export interface TournamentDetails extends Tournament {
    registrations: Array<{
        id: number;
        team_id: number;
        team_name: string;
        status: string;
        created_at: string | null;
    }>;
}

// ── API calls ──────────────────────────────────────────────────────────────

export const api = {
    overview: () => get<OverviewData>("/overview"),

    dailyChart: () => get<DailyChartData>("/charts/daily"),

    monthlyChart: () => get<MonthlyChartData>("/charts/monthly"),

    paymentMethods: () => get<PaymentMethodsData>("/charts/payments"),

    pcs: () => get<{ pcs: PC[]; total: number }>("/pcs"),

    members: (page = 1, search = "") =>
        get<{ members: Member[]; paging: Record<string, number> }>("/members", {
            page,
            search,
        }),

    getConfig: () => get<ConfigData>("/config"),

    getIcafeData: () => get<{ zones: string; tariffs: string }>("/config/icafe-data"),

    saveConfig: (data: { api_key?: string; cafe_id?: string; club_name?: string; club_logo_url?: string; club_main_photo_url?: string; club_photos?: string; address?: string; telegram_username?: string; lat?: number | null; lng?: number | null; working_hours?: string; zones?: string; tariffs?: string; internet_speed?: string }) =>
        post<{ ok: boolean }>("/config", data),

    uploadLogo: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        const headers = getHeaders();
        const res = await fetch(`${BASE}/upload-logo`, {
            method: "POST",
            headers,
            body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
    },
    uploadClubPhoto: async (file: File): Promise<{ url: string }> => {
        const formData = new FormData();
        formData.append("file", file);
        const headers = getHeaders();
        const res = await fetch(`${BASE}/upload-club-photo`, {
            method: "POST",
            headers,
            body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        return res.json();
    },

    getMonthlyAggregatedIncome: () => get<{ data: { month: string; amount: number }[] }>("/charts/income-monthly"),

    getMembers: (params: { page?: number; search?: string; sort_field?: string; sort_dir?: string }) =>
        get<{ members: any[]; paging: any }>("/members", params),

    health: () => get<{ status: string; configured: boolean; timestamp: string }>("/health"),

    // Admin routes
    adminClubs: () => get<{
        id: number;
        name: string;
        cafe_id: string;
        api_key: string;
        logo_url: string;
        address: string;
        phone: string;
        instagram: string;
        working_hours: string;
        lat: number;
        lng: number;
        description: string;
    }[]>("/admin/clubs"),
    addClub: (data: { name: string; api_key: string; cafe_id: string }) => post<{ ok: boolean }>("/admin/clubs", data),
    updateClub: (clubId: number, data: any) => put<{ message: string }>(`/admin/clubs/${clubId}`, data),
    assignUser: (data: { username: string; password: string; club_id: string }) => post<{ ok: boolean }>("/admin/assign-user", data),
    adminUsers: () => get<RegisteredUser[]>("/admin/users"),
    updateUser: (userId: number, data: { role?: string; club_id?: number | null; is_verified?: boolean }) =>
        put<{ message: string }>(`/admin/users/${userId}`, data),
    deleteUser: (userId: number) => del<{ message: string }>(`/admin/users/${userId}`),
    managerReviews: () => get<{ reviews: DashboardReview[]; summary: { count: number; average_rating: number } }>("/reviews"),
    managerBookings: () => get<{ bookings: DashboardBooking[]; summary: { count: number; pending_count: number; cancelled_count: number } }>("/bookings"),
    bookingPcOptions: () => get<{ pcs: BookingPcOption[]; total: number }>("/pcs"),
    createManagerBooking: (data: {
        client_name: string;
        phone: string;
        duration?: string;
        selected_pcs: Array<{ zone_name: string; pc_name: string }>;
    }) => post<{ message: string; booking: DashboardBooking }>("/bookings", data),
    updateBookingStatus: (bookingId: number, status: "approved" | "rejected" | "completed") =>
        put<{
            message: string;
            booking: DashboardBooking;
            maintenance?: {
                requested?: boolean;
                success?: boolean | null;
                mode?: string;
                message?: string;
                result?: { code?: number | string; message?: string };
                fallback_from_names_result?: { code?: number | string; message?: string };
                fallback_from_name_objects_result?: { code?: number | string; message?: string };
                fallback_from_rich_objects_result?: { code?: number | string; message?: string };
                fallback_from_enabled_objects_result?: { code?: number | string; message?: string };
                fallback_from_full_names_result?: { code?: number | string; message?: string };
                fallback_from_ids_str_result?: { code?: number | string; message?: string };
                fallback_from_put_pc_enabled_result?: { code?: number | string; message?: string };
                fallback_from_put_edit_pc_enabled_result?: { code?: number | string; message?: string };
            };
        }>(`/bookings/${bookingId}/status`, { status }),
    cancelBooking: (bookingId: number, reason: string) =>
        put<{ message: string; booking: DashboardBooking }>(`/bookings/${bookingId}/cancel`, { reason }),
    changePassword: (data: { current_password: string; new_password: string }) =>
        put<{ message: string }>("/auth/change-password", data),

    cashbackConfig: () => get<CashbackConfig>("/cashback/config"),
    saveCashbackConfig: (data: { cashback_enabled?: boolean; cashback_percent?: number }) =>
        post<CashbackConfig & { ok: boolean }>("/cashback/config", data),
    cashbackTransactions: (limit = 50) =>
        get<{ transactions: CashbackTransaction[] }>("/cashback/transactions", { limit }),
    accrueCashback: (data: { qr_payload: string; amount: number; note?: string }) =>
        post<{ message: string; transaction: CashbackTransaction }>("/cashback/accrue", data),
    publicTournaments: () => get<Tournament[]>("/public/tournaments"),
    publicTournamentDetails: (tournamentId: number) => get<TournamentDetails>(`/public/tournaments/${tournamentId}`),
    publicTournamentBracket: (tournamentId: number) =>
        get<{ tournament: Tournament; matches: TournamentMatch[] }>(`/public/tournaments/${tournamentId}/bracket`),
    adminTournaments: () => get<Tournament[]>("/admin/tournaments"),
    createTournament: (data: {
        title: string;
        game: string;
        team_format: string;
        location: string;
        starts_at: string;
        check_in_at: string;
        entry_fee: string;
        format: string;
        description?: string;
        status?: string;
        max_teams?: number;
        prize_pool?: string;
        stream_url?: string;
    }) => post<{ message: string; tournament: Tournament }>("/admin/tournaments", data),
    updateTournament: (tournamentId: number, data: Partial<Tournament>) =>
        put<{ message: string; tournament: Tournament }>(`/admin/tournaments/${tournamentId}`, data),
    deleteTournament: (tournamentId: number) => del<{ message: string }>(`/admin/tournaments/${tournamentId}`),
    addTournamentTeam: (tournamentId: number, teamId: number) => post<{ message: string }>(`/admin/tournaments/${tournamentId}/registrations`, { team_id: teamId }),
    removeTournamentTeam: (tournamentId: number, registrationId: number) => del<{ message: string }>(`/admin/tournaments/${tournamentId}/registrations/${registrationId}`),
    adminTeams: () => get<Team[]>("/admin/teams"),
    createTeam: (data: { name: string; tag?: string }) => post<{ message: string; team: Team }>("/admin/teams", data),
    updateTeam: (teamId: number, data: { name?: string; tag?: string }) => put<{ message: string; team: Team }>(`/admin/teams/${teamId}`, data),
    deleteTeam: (teamId: number) => del<{ message: string }>(`/admin/teams/${teamId}`),
    adminTeamMembers: (teamId: number) => get<{ team: Team; members: TeamMember[] }>(`/admin/teams/${teamId}/members`),
    adminAddTeamMember: (teamId: number, username: string) => post<{ message: string }>(`/admin/teams/${teamId}/members`, { username }),
    adminRemoveTeamMember: (teamId: number, userId: number) => del<{ message: string }>(`/admin/teams/${teamId}/members/${userId}`),
    adminUploadTeamLogo: async (teamId: number, file: File) => {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`${BASE}/admin/teams/${teamId}/logo`, {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("icafe_token")}` },
            body: form,
        });
        if (!res.ok) throw await toApiError(res);
        return res.json() as Promise<{ message: string; logo_url: string }>;
    },
    assignCaptain: (teamId: number, userId: number) =>
        post<{ message: string; team: Team }>(`/admin/teams/${teamId}/assign-captain`, { user_id: userId }),
    captainTeamMe: () => get<{ team: Team; members: TeamMember[] }>("/captain/team/me"),
    captainAddTeamMember: (username: string) => post<{ message: string }>("/captain/team/me/members", { username }),
    captainRemoveTeamMember: (userId: number) => del<{ message: string }>(`/captain/team/me/members/${userId}`),
    captainRegisterTournament: (tournamentId: number) => post<{ message: string }>(`/captain/tournaments/${tournamentId}/register`, {}),
    approveTournamentRegistration: (tournamentId: number, registrationId: number) =>
        post<{ message: string }>(`/admin/tournaments/${tournamentId}/registrations/${registrationId}/approve`, {}),
    generateTournamentBracket: (tournamentId: number) =>
        post<{ message: string; matches_count: number }>(`/admin/tournaments/${tournamentId}/generate-bracket`, {}),

    // Generic helpers for anything else
    get: <T>(path: string, params?: any) => get<T>(path, params),
    post: <T>(path: string, body: any) => post<T>(path, body),
};

/** Format a number as "1 234 567" with spaces */
export function formatMoney(value: number): string {
    return Math.round(value).toLocaleString("ru-RU");
}
