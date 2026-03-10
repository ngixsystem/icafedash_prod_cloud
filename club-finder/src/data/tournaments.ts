export type TournamentInfo = {
  id: number;
  title: string;
  date: string;
  players: string;
  location: string;
  prize: string;
  game: string;
  entryFee: string;
  checkIn: string;
  format: string;
  description: string;
  rules: string[];
};

export const tournaments: TournamentInfo[] = [
  {
    id: 1,
    title: "FRAG Night Cup",
    date: "15 марта 2026, 19:00",
    players: "5v5 • 16 команд",
    location: "TeamPro Sergeli",
    prize: "20 000 000 сум",
    game: "CS2",
    entryFee: "150 000 сум / команда",
    checkIn: "15 марта 2026, 17:30",
    format: "Single Elimination, BO1, финал BO3",
    description: "Вечерний кубок для сильнейших команд Ташкента. Локальный LAN-турнир с прямой трансляцией финала.",
    rules: [
      "Состав: 5 основных + 1 запасной.",
      "Наличие паспорта или ID обязательно.",
      "Опоздание более 15 минут = техническое поражение.",
    ],
  },
  {
    id: 2,
    title: "Cyber Weekend Showdown",
    date: "22 марта 2026, 18:30",
    players: "2v2 • 24 команды",
    location: "Energy Gaming",
    prize: "12 000 000 сум",
    game: "PUBG Mobile",
    entryFee: "80 000 сум / команда",
    checkIn: "22 марта 2026, 17:00",
    format: "Группы + плей-офф, BO3",
    description: "Уикенд-серия для мобильных команд с быстрым форматом матчей и наградами для MVP турнира.",
    rules: [
      "Состав: 2 игрока + 1 замена.",
      "Устройства проверяются перед стартом.",
      "Запрещены сторонние модификации клиента.",
    ],
  },
];
