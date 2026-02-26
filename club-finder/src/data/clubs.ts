import club1 from "@/assets/club1.jpg";
import club2 from "@/assets/club2.jpg";
import club3 from "@/assets/club3.jpg";

export interface Club {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  pcsTotal: number;
  pcsFree: number;
  pricePerHour: number;
  isOpen: boolean;
  lat: number;
  lng: number;
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  pcsTotal: number;
  pcsFree: number;
  pricePerHour: number;
  specs: string;
}

export const clubs: Club[] = [
  {
    id: "1",
    name: "CyberArena",
    address: "ул. Пушкина, 10",
    image: club1,
    rating: 4.8,
    pcsTotal: 60,
    pcsFree: 23,
    pricePerHour: 150,
    isOpen: true,
    lat: 55.7558,
    lng: 37.6173,
    zones: [
      { id: "z1", name: "Standard", pcsTotal: 30, pcsFree: 15, pricePerHour: 100, specs: "RTX 3060 / i5-12400 / 16GB" },
      { id: "z2", name: "VIP", pcsTotal: 20, pcsFree: 6, pricePerHour: 200, specs: "RTX 4080 / i7-13700K / 32GB" },
      { id: "z3", name: "Pro Arena", pcsTotal: 10, pcsFree: 2, pricePerHour: 250, specs: "RTX 4090 / i9-13900K / 64GB" },
    ],
  },
  {
    id: "2",
    name: "FragZone",
    address: "пр. Ленина, 42",
    image: club2,
    rating: 4.5,
    pcsTotal: 40,
    pcsFree: 8,
    pricePerHour: 120,
    isOpen: true,
    lat: 55.7612,
    lng: 37.6295,
    zones: [
      { id: "z4", name: "Standard", pcsTotal: 25, pcsFree: 5, pricePerHour: 80, specs: "RTX 3060 / i5-12400 / 16GB" },
      { id: "z5", name: "Premium", pcsTotal: 15, pcsFree: 3, pricePerHour: 160, specs: "RTX 4070 / i7-13700K / 32GB" },
    ],
  },
  {
    id: "3",
    name: "NeonPlay",
    address: "ул. Гагарина, 7",
    image: club3,
    rating: 4.9,
    pcsTotal: 80,
    pcsFree: 35,
    pricePerHour: 180,
    isOpen: false,
    lat: 55.7480,
    lng: 37.6100,
    zones: [
      { id: "z6", name: "Casual", pcsTotal: 40, pcsFree: 20, pricePerHour: 120, specs: "RTX 3060 Ti / i5-13400 / 16GB" },
      { id: "z7", name: "Ranked", pcsTotal: 25, pcsFree: 10, pricePerHour: 200, specs: "RTX 4070 Ti / i7-13700K / 32GB" },
      { id: "z8", name: "Bootcamp", pcsTotal: 15, pcsFree: 5, pricePerHour: 300, specs: "RTX 4090 / i9-14900K / 64GB" },
    ],
  },
];
