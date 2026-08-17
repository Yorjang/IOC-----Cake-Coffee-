import { Crosshair, MapPin, Search, Store, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StoreLocation } from "../../data/storeLocations";

type StoreSelectionModalProps = {
  stores: StoreLocation[];
  selectedStore?: StoreLocation | null;
  manualLocationRequired?: boolean;
  onClose: () => void;
};

export function StoreSelectionModal({
  stores,
  selectedStore,
  manualLocationRequired = false,
  onClose,
}: StoreSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const storeRefs = useRef<Record<string, HTMLElement | null>>({});

  const filteredStores = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    return stores.filter((store) => {
      if (openOnly && !store.isOpenNow) return false;
      if (!keyword) return true;
      return `${store.name} ${store.shortName} ${store.address}`.toLowerCase().includes(keyword);
    });
  }, [openOnly, searchQuery, stores]);

  const nearestStore =
    (selectedStore && stores.find((store) => store.id === selectedStore.id)) ??
    stores.find((store) => store.isOpenNow) ??
    stores[0];

  useEffect(() => {
    if (!nearestStore?.id) return;
    const timer = window.setTimeout(() => {
      storeRefs.current[nearestStore.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [nearestStore?.id]);

  if (stores.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sidebar/70 px-3 py-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <header className="grid shrink-0 gap-3 border-b bg-secondary/60 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">Sweet Bean</p>
            <h2 className="mt-1 text-2xl md:text-3xl">Danh sách cửa hàng</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Chi nhánh phục vụ được hệ thống tự động xác định theo vị trí và tình trạng mở cửa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-card text-muted-foreground transition hover:bg-background hover:text-foreground"
            title="Đóng"
            aria-label="Đóng danh sách cửa hàng"
          >
            <X size={18} />
          </button>
        </header>

        <div className="shrink-0 border-b px-4 py-3">
          {manualLocationRequired && (
            <div className="mb-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-foreground">
              Trình duyệt chưa chia sẻ vị trí. Hệ thống đang dùng chi nhánh khả dụng đầu tiên.
            </div>
          )}
          <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc địa chỉ cửa hàng..."
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={() => setOpenOnly(false)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${!openOnly ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
              Tất cả chi nhánh
            </button>
            <button type="button" onClick={() => setOpenOnly(true)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${openOnly ? "bg-green-600 text-white" : "bg-card text-muted-foreground"}`}>
              Đang mở cửa
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[1fr_260px]">
          <div className="grid max-h-[52vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredStores.map((store) => {
              const isAutomaticStore = nearestStore?.id === store.id;
              return (
                <article
                  key={store.id}
                  ref={(element) => {
                    storeRefs.current[store.id] = element;
                  }}
                  className={`rounded-2xl border p-3 ${isAutomaticStore ? "border-primary bg-secondary" : "bg-card"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Store size={16} />
                    </span>
                    {isAutomaticStore && (
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                        Tự động phục vụ
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-sans text-sm font-semibold text-foreground">{store.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`size-2 rounded-full ${store.isOpenNow ? "bg-green-500" : "bg-red-500"}`} />
                    <span className={store.isOpenNow ? "font-semibold text-green-700" : "font-semibold text-red-600"}>{store.status}</span>
                    <span className="text-muted-foreground">{store.hours}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{store.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-background px-2.5 py-1 text-primary">{store.distance}</span>
                    <span className="rounded-full bg-background px-2.5 py-1 text-muted-foreground">{store.delivery}</span>
                  </div>
                </article>
              );
            })}

            {filteredStores.length === 0 && (
              <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground sm:col-span-2">
                Không tìm thấy cửa hàng phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </div>

          <aside className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                {manualLocationRequired ? <MapPin size={16} /> : <Crosshair size={16} />}
              </span>
              <div>
                <p className="text-sm font-semibold">Chi nhánh đang phục vụ</p>
                <p className="text-xs text-muted-foreground">
                  {manualLocationRequired ? "Được chọn tự động theo khả năng phục vụ" : "Được phát hiện tự động từ vị trí hiện tại"}
                </p>
              </div>
            </div>
            {nearestStore && (
              <div className="mt-4 rounded-xl bg-secondary p-3 text-sm leading-6 text-muted-foreground">
                <b className="text-foreground">{nearestStore.name}</b>
                <br />
                {nearestStore.address}
                <div className={`mt-1 font-semibold ${nearestStore.isOpenNow ? "text-green-700" : "text-red-600"}`}>
                  {nearestStore.status} · {nearestStore.hours}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Đóng danh sách
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
}
