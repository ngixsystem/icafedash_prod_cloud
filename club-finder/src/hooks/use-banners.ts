import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BannerData {
    id: number;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
}

export interface AdminBannerData extends BannerData {
    sort_order: number;
    is_active: boolean;
    created_at: string | null;
}

export const useBanners = () => {
    return useQuery({
        queryKey: ["public_banners"],
        queryFn: async (): Promise<BannerData[]> => {
            const resp = await fetch("/api/public/banners");
            if (!resp.ok) throw new Error("Failed to fetch banners");
            return resp.json();
        },
    });
};

export const useAdminBanners = (token: string | null) => {
    return useQuery({
        queryKey: ["admin_banners"],
        queryFn: async (): Promise<AdminBannerData[]> => {
            const resp = await fetch("/api/admin/banners", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) throw new Error("Failed to fetch banners");
            return resp.json();
        },
        enabled: !!token,
    });
};

export const useCreateBanner = (token: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (formData: FormData) => {
            const resp = await fetch("/api/admin/banners", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ message: "Error" }));
                throw new Error(err.message);
            }
            return resp.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin_banners"] });
            qc.invalidateQueries({ queryKey: ["public_banners"] });
        },
    });
};

export const useUpdateBanner = (token: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
            const resp = await fetch(`/api/admin/banners/${id}`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ message: "Error" }));
                throw new Error(err.message);
            }
            return resp.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin_banners"] });
            qc.invalidateQueries({ queryKey: ["public_banners"] });
        },
    });
};

export const useDeleteBanner = (token: string | null) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const resp = await fetch(`/api/admin/banners/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) throw new Error("Failed to delete banner");
            return resp.json();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin_banners"] });
            qc.invalidateQueries({ queryKey: ["public_banners"] });
        },
    });
};
