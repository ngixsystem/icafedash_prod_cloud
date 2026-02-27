import { useQuery } from "@tanstack/react-query";

export interface ClubData {
    id: number;
    name: string;
    logo: string | null;
    pcsTotal: number;
    pcsFree: number;
    rating: number;
    address: string;
    description?: string;
    working_hours?: string;
    lat?: number;
    lng?: number;
    isOpen: boolean;
    pricePerHour?: number;
    zones?: any[];
    tariffs?: any[];
}

export const useClubs = () => {
    return useQuery({
        queryKey: ["public_clubs"],
        queryFn: async (): Promise<ClubData[]> => {
            const resp = await fetch("/api/public/clubs");
            if (!resp.ok) throw new Error("Failed to fetch clubs");
            return resp.json();
        },
    });
};

export const useClub = (id: string | undefined) => {
    return useQuery({
        queryKey: ["public_club", id],
        queryFn: async (): Promise<ClubData> => {
            if (!id) throw new Error("No ID provided");
            const resp = await fetch(`/api/public/clubs/${id}`);
            if (!resp.ok) throw new Error("Failed to fetch club");
            return resp.json();
        },
        enabled: !!id,
    });
};
