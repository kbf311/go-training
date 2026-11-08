import { Monster, MonsterListResponse, MonsterPayload, User } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let errorData: any = null;
    try {
      errorData = await res.json();
    } catch {
      // jsonでパースできない場合はテキスト
      const text = await res.text();
      throw new Error(text || `Request failed with status ${res.status}`);
    }

    if (errorData?.errors && Array.isArray(errorData.errors)) {
      throw new Error(errorData.errors.join("\n"));
    }
    if (errorData?.error) {
      throw new Error(errorData.error);
    }
    throw new Error(`Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // 認証
  async login(username: string, password: string): Promise<User> {
    return request<User>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async logout(): Promise<{ message: string }> {
    return request<{ message: string }>("/logout", {
      method: "POST",
    });
  },

  async getMe(): Promise<User> {
    return request<User>("/auth/me", {
      method: "GET",
    });
  },

  // モンスター
  async getMonsters(params: {
    q?: string;
    element?: string;
    rarity?: number;
    habitat?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<MonsterListResponse> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set("q", params.q);
    if (params.element) searchParams.set("element", params.element);
    if (params.rarity) searchParams.set("rarity", params.rarity.toString());
    if (params.habitat) searchParams.set("habitat", params.habitat);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.order) searchParams.set("order", params.order);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const qs = searchParams.toString();
    return request<MonsterListResponse>(`/monsters${qs ? `?${qs}` : ""}`);
  },

  async getMonster(id: number): Promise<Monster> {
    return request<Monster>(`/monsters/${id}`);
  },

  async createMonster(data: MonsterPayload): Promise<Monster> {
    return request<Monster>("/monsters", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateMonster(id: number, data: MonsterPayload): Promise<{ message: string }> {
    return request<{ message: string }>(`/monsters/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async deleteMonster(id: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/monsters/${id}`, {
      method: "DELETE",
    });
  },

  async resetData(): Promise<{ message: string }> {
    return request<{ message: string }>("/data/reset", {
      method: "POST",
    });
  },
};

