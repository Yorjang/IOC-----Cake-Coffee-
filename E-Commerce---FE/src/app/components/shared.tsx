import { Heart, Star } from "lucide-react";
import { useState } from "react";
import { MESSAGES } from "../../constants/messages";
import { env } from "../../config/env";
import { VIEW_KEYS } from "../../config/appConfig";

export function Btn({ children, variant = "primary", disabled = false, onClick, small = false }: any) {
  const cls = variant === "primary"
    ? "bg-primary text-primary-foreground hover:bg-primary/80"
    : variant === "ghost"
    ? "bg-transparent hover:bg-secondary text-foreground"
    : "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full ${small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm"} transition shadow-sm focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${cls}`}
    >
      {children}
    </button>
  );
}

export function ProductCard({ p, compact = false, setView }: any) {
  const [wishlisted, setWishlisted] = useState(false);
  return (
    <article
      onClick={() => setView?.(VIEW_KEYS.DETAIL)}
      className="group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-48 bg-muted">
        <img src={p[3]} alt={p[0]} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-bold text-primary">{p[5]}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setWishlisted(!wishlisted); }}
          className={`absolute right-3 top-3 rounded-full p-2 transition ${wishlisted ? "bg-rose-100 text-rose-500" : "bg-card/90 hover:bg-accent"}`}
        >
          <Heart size={16} className={wishlisted ? "fill-rose-500" : ""} />
        </button>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{p[2]}</span>
          <span className="flex items-center gap-1"><Star className="fill-sidebar-primary text-sidebar-primary" size={14} />{p[4]}</span>
        </div>
        <h3 className="font-sans text-base">{p[0]}</h3>
        <div className="flex items-center justify-between">
          <b className="text-lg text-primary">{p[1]}</b>
          {!compact && (
            <div className="flex gap-2">
              <Btn small onClick={(e: any) => { e.stopPropagation(); setView?.(VIEW_KEYS.CART); }}>Thêm</Btn>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function Section({ title, children, sub }: any) {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-9 sm:px-6 lg:px-10">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">{env.APP_NAME}</p>
          <h2 className="mt-1 text-3xl md:text-4xl">{title}</h2>
          {sub && <p className="mt-2 text-muted-foreground">{sub}</p>}
        </div>
        <Btn variant="secondary">{MESSAGES.BUTTON_VIEW_ALL}</Btn>
      </div>
      {children}
    </section>
  );
}
