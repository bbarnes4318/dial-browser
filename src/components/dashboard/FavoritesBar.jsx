import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Pin, UtensilsCrossed, Car, X } from "lucide-react";

/**
 * FavoritesBar — the member's pinned food & transport services, shown at the
 * top of the dashboard for quick access. Favorites are SavedService records
 * with service_type "food" or "transport", pinned from the order history.
 */
export default function FavoritesBar() {
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await base44.entities.SavedService.list("-created_date", 100);
      const ft = (list || []).filter(
        (s) => s.service_type === "food" || s.service_type === "transport"
      );
      setFavs(ft);
    } catch (e) {
      console.error("FavoritesBar load:", e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id) => {
    try {
      await base44.entities.SavedService.delete(id);
      setFavs((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      console.error("FavoritesBar remove:", e?.message);
    }
  };

  if (loading) return null;

  if (favs.length === 0) {
    return (
      <div
        className="mb-6 flex items-center gap-2 px-3 py-2.5 rounded-lg"
        style={{
          background: "rgba(16,20,29,0.6)",
          border: "0.5px solid rgba(138,143,152,0.15)",
        }}
      >
        <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          Pin your favorite food &amp; transport services from your{" "}
          <Link to="/order-history" className="text-primary underline">
            order history
          </Link>{" "}
          for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Pin className="w-3.5 h-3.5 text-primary" />
        <h2 className="font-mono text-[10px] tracking-widest uppercase text-primary">
          Your favorites · quick access
        </h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 overscroll-contain">
        {favs.map((f) => {
          const isFood = f.service_type === "food";
          const Icon = isFood ? UtensilsCrossed : Car;
          return (
            <div
              key={f.id}
              className="shrink-0 flex items-center gap-2 pl-3 pr-1.5 py-2 rounded-lg"
              style={{
                background: "rgba(209,255,38,0.06)",
                border: "0.5px solid rgba(209,255,38,0.25)",
              }}
            >
              <Link
                to={f.link_url || "/order-history"}
                className="flex items-center gap-2"
                title={f.service_name}
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground max-w-[160px] truncate">
                  {f.service_name}
                </span>
              </Link>
              <button
                onClick={() => remove(f.id)}
                className="text-muted-foreground hover:text-destructive p-1"
                title="Unpin"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}