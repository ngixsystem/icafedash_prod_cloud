import { useQuery } from "@tanstack/react-query";

interface ClubData {
    id: number;
    name: string;
    logo: string | null;
    pcsTotal: number;
    pcsFree: number;
    rating: number;
    address: string;
    isOpen: boolean;
    pricePerHour: number;
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
