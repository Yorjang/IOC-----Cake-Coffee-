export function VoucherRow({ code, title, sub, onClick }: any) {
  return (
    <div onClick={onClick} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 cursor-pointer hover:border-foreground/30 transition">
      <div>
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-1">{code}</p>
        <p className="text-sm font-bold text-foreground leading-snug">{title}</p>
        <p className="text-[12px] text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}
