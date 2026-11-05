export type Listing = {
  id: string;
  type: "SELL" | "RENT";
  category: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  rentUnit: string | null;
  depositCents: number | null;
  location: string | null;
  contactNote: string;
  status: string;
  createdAt: string;
  sellerId: string;
  seller: { id: string; name: string; email: string };
};

export type DevUser = { id: string; name: string; email: string; role: string };

let userId = localStorage.getItem("tn-user") ?? "";
export const setUser = (id: string) => {
  userId = id;
  localStorage.setItem("tn-user", id);
};
export const getUser = () => userId;

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", "x-user-id": userId, ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : JSON.stringify(body.error ?? res.statusText));
  return body as T;
}

export const api = {
  users: () => req<DevUser[]>("/api/dev/users"),
  list: (params: Record<string, string>) =>
    req<{ items: Listing[]; nextCursor: string | null }>(`/api/listings?${new URLSearchParams(params)}`),
  create: (data: unknown) => req<Listing>("/api/listings", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: unknown) => req<Listing>(`/api/listings/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const money = (cents: number, cur: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(cents / 100);
