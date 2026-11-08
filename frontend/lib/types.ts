export interface User {
  id: number;
  username: string;
}

export interface Monster {
  id: number;
  name: string;
  element: string;
  rarity: number;
  habitats: string;
  habitat_list: string[];
  hp: number;
  attack: number;
  description: string;
}

export interface MonsterListResponse {
  monsters: Monster[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface MonsterPayload {
  name: string;
  element: string;
  rarity: number;
  habitats: string[];
  hp: number;
  attack: number;
  description: string;
}

export const ELEMENTS = ["炎", "水", "風", "光", "闇"] as const;
export const RARITIES = [3, 4, 5] as const;
export const HABITATS = ["草原", "洞窟", "魔王城"] as const;

export const ELEMENT_BADGE_CLASSES: Record<string, string> = {
  炎: "bg-red-100 text-red-800 border-red-200",
  水: "bg-blue-100 text-blue-800 border-blue-200",
  風: "bg-green-100 text-green-800 border-green-200",
  光: "bg-yellow-100 text-yellow-800 border-yellow-200",
  闇: "bg-purple-100 text-purple-800 border-purple-200",
};

