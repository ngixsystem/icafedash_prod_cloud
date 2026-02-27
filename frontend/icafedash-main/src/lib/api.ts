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
    if (!res.ok) throw new Error(`API error ${res.status}`);
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
    if (!res.ok) throw new Error(`API error ${res.status}`);
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
    if (!res.ok) throw new Error(`API error ${res.status}`);
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
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface OverviewData {
    today_revenue: number;
    week_revenue: number;
    total_members: number;
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
    address: string;
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

    saveConfig: (data: { api_key?: string; cafe_id?: string; club_name?: string; club_logo_url?: string; address?: string; working_hours?: string; zones?: string; tariffs?: string; internet_speed?: string }) =>
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

    // Generic helpers for anything else
    get: <T>(path: string, params?: any) => get<T>(path, params),
    post: <T>(path: string, body: any) => post<T>(path, body),
};

/** Format a number as "1 234 567" with spaces */
export function formatMoney(value: number): string {
    return Math.round(value).toLocaleString("ru-RU");
}
