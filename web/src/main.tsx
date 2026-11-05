import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { api, DevUser, getUser, Listing, money, setUser } from "./api";
import "./styles.css";

const CATEGORIES = ["PRODUCT", "LAND", "VEHICLE", "SPACE", "SERVICE", "OTHER"];

function Card({ l, me, onChange }: { l: Listing; me: string; onChange: () => void }) {
  const mine = l.sellerId === me;
  const set = (status: string) => api.update(l.id, { status }).then(onChange).catch((e) => alert(e.message));
  return (
    <article className="card">
      <div className="row">
        <span className={`tag ${l.type}`}>{l.type === "SELL" ? "For sale" : "For rent"}</span>
        <span className="tag">{l.category}</span>
        {l.status !== "ACTIVE" && <span className="tag muted">{l.status}</span>}
      </div>
      <h3>{l.title}</h3>
      <p className="price">
        {money(l.priceCents, l.currency)}
        {l.rentUnit && ` / ${l.rentUnit.toLowerCase()}`}
        {l.depositCents ? <small> · deposit {money(l.depositCents, l.currency)}</small> : null}
      </p>
      <p>{l.description}</p>
      {l.location && <p className="meta">📍 {l.location}</p>}
      <p className="contact">
        <b>{l.seller.name}</b> — {l.contactNote}
      </p>
      {mine && l.status === "ACTIVE" && (
        <div className="row">
          <button onClick={() => set(l.type === "SELL" ? "SOLD" : "RENTED")}>
            Mark {l.type === "SELL" ? "sold" : "rented"}
          </button>
          <button className="ghost" onClick={() => set("ARCHIVED")}>Archive</button>
        </div>
      )}
      {mine && l.status !== "ACTIVE" && <button className="ghost" onClick={() => set("ACTIVE")}>Relist</button>}
    </article>
  );
}

function NewListing({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ type: "SELL", category: "PRODUCT", title: "", description: "", price: "", rentUnit: "DAY", location: "", contactNote: "" });
  const [err, setErr] = useState("");
  const up = (k: string) => (e: React.ChangeEvent<any>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.create({
        type: f.type, category: f.category, title: f.title, description: f.description,
        priceCents: Math.round(Number(f.price) * 100),
        rentUnit: f.type === "RENT" ? f.rentUnit : undefined,
        location: f.location || undefined, contactNote: f.contactNote,
      });
      onDone();
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <form className="form" onSubmit={submit}>
      <h2>New listing</h2>
      <div className="row">
        <select value={f.type} onChange={up("type")}><option value="SELL">Sell</option><option value="RENT">Rent</option></select>
        <select value={f.category} onChange={up("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <input placeholder="Title" value={f.title} onChange={up("title")} required />
      <textarea placeholder="Description" value={f.description} onChange={up("description")} required />
      <div className="row">
        <input type="number" min="0" placeholder="Price" value={f.price} onChange={up("price")} required />
        {f.type === "RENT" && (
          <select value={f.rentUnit} onChange={up("rentUnit")}>{["HOUR", "DAY", "WEEK", "MONTH"].map((u) => <option key={u}>{u}</option>)}</select>
        )}
      </div>
      <input placeholder="Location (optional)" value={f.location} onChange={up("location")} />
      <input placeholder="How should buyers contact you? (phone / email / desk)" value={f.contactNote} onChange={up("contactNote")} required />
      {err && <p className="err">{err}</p>}
      <button type="submit">Publish</button>
    </form>
  );
}

function App() {
  const [users, setUsers] = useState<DevUser[]>([]);
  const [me, setMe] = useState(getUser());
  const [tab, setTab] = useState<"browse" | "mine" | "new">("browse");
  const [filters, setFilters] = useState({ q: "", type: "", category: "" });
  const [items, setItems] = useState<Listing[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.users().then((u) => {
      setUsers(u);
      if (!u.find((x) => x.id === me) && u[0]) { setUser(u[0].id); setMe(u[0].id); }
    }).catch((e) => setErr(e.message));
  }, []);

  const load = useCallback(() => {
    if (!me || tab === "new") return;
    const p: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => v && (p[k] = v));
    if (tab === "mine") { p.mine = "true"; p.status = "ACTIVE"; }
    api.list(p).then((r) => { setItems(r.items); setErr(""); }).catch((e) => setErr(e.message));
  }, [me, tab, filters]);
  useEffect(load, [load]);

  return (
    <div className="app">
      <header>
        <h1>TradeNest</h1>
        <select value={me} onChange={(e) => { setUser(e.target.value); setMe(e.target.value); }} title="Dev login (temporary)">
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </header>
      <nav>
        {(["browse", "mine", "new"] as const).map((t) => (
          <button key={t} className={tab === t ? "active" : "ghost"} onClick={() => setTab(t)}>
            {{ browse: "Browse", mine: "My listings", new: "+ Sell / Rent" }[t]}
          </button>
        ))}
      </nav>
      {tab === "new" ? (
        <NewListing onDone={() => setTab("mine")} />
      ) : (
        <>
          {tab === "browse" && (
            <div className="filters">
              <input placeholder="Search…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">Sell + Rent</option><option value="SELL">For sale</option><option value="RENT">For rent</option>
              </select>
              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}
          {err && <p className="err">{err}</p>}
          <div className="grid">
            {items.map((l) => <Card key={l.id} l={l} me={me} onChange={load} />)}
            {!items.length && !err && <p className="meta">Nothing here yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
