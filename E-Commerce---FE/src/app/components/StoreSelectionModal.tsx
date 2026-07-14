import { CheckCircle, Crosshair, MapPin, Search, Store, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { StoreLocation } from "../../data/storeLocations";

type StoreSelectionModalProps = {
  stores: StoreLocation[];
  selectedStore?: StoreLocation | null;
  manualLocationRequired?: boolean;
  onSelect: (store: StoreLocation) => void;
  onClose: () => void;
};

function ModalButton({
  children,
  variant = "primary",
  onClick,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  onClick: () => void;
}) {
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground hover:bg-primary/85"
      : "bg-secondary text-secondary-foreground hover:bg-secondary/80";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-ring ${styles}`}
    >
      {children}
    </button>
  );
}

export function StoreSelectionModal({
  stores,
  selectedStore,
  manualLocationRequired = false,
  onSelect,
  onClose,
}: StoreSelectionModalProps) {
  const [manualLocation, setManualLocation] = useState("");

  const filteredStores = useMemo(() => {
    const keyword = manualLocation.trim().toLowerCase();
    if (!keyword) return stores;

    return stores.filter((store) => {
      const searchable = `${store.name} ${store.shortName} ${store.address}`.toLowerCase();
      return searchable.includes(keyword);
    });
  }, [manualLocation, stores]);

  const recommended = stores[0] ?? filteredStores[0];

  if (!recommended) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-sidebar/70 px-3 py-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="grid shrink-0 gap-3 border-b bg-secondary/60 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[.22em] text-primary">Sweet Bean</p>
            <h2 className="mt-1 text-2xl md:text-3xl">Chọn cửa hàng phục vụ bạn</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Menu, tồn kho và thời gian giao sẽ được ưu tiên theo chi nhánh bạn chọn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-card text-muted-foreground transition hover:bg-background hover:text-foreground"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="shrink-0 border-b px-4 py-3">
          {manualLocationRequired && (
            <div className="mb-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-foreground">
              Bạn chưa chia sẻ vị trí. Hãy nhập quận, đường hoặc khu vực để chọn chi nhánh phù hợp.
            </div>
          )}
          <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input
              value={manualLocation}
              onChange={(event) => setManualLocation(event.target.value)}
              placeholder="Nhập vị trí của bạn, ví dụ: Quận 1, Thảo Điền, Phan Xích Long..."
              className="w-full border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[1fr_260px]">
          <div className="grid max-h-[52vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {filteredStores.map((store) => {
              const active = selectedStore?.id === store.id;

              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => {
                    onSelect(store);
                    onClose();
                  }}
                  className={`rounded-2xl border p-3 text-left transition hover:border-primary hover:shadow-md ${
                    active ? "border-primary bg-secondary" : "bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Store size={16} />
                    </span>
                    {active && <CheckCircle size={18} className="text-primary" />}
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-sans text-sm font-semibold text-foreground">{store.name}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{store.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-background px-2.5 py-1 text-primary">{store.distance}</span>
                    <span className="rounded-full bg-background px-2.5 py-1 text-muted-foreground">
                      {store.delivery}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredStores.length === 0 && (
              <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground sm:col-span-2">
                Chưa tìm thấy chi nhánh phù hợp. Bạn có thể thử nhập tên quận, tên đường hoặc chọn tiếp chi nhánh
                đang hiển thị gần nhất.
              </div>
            )}
          </div>

          <aside className="rounded-2xl bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                {manualLocationRequired ? <MapPin size={16} /> : <Crosshair size={16} />}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {manualLocationRequired ? "Gợi ý theo nhập tay" : "Gợi ý gần nhất"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {manualLocationRequired ? "Dựa trên khu vực bạn nhập" : `${recommended.distance} từ vị trí hiện tại`}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-secondary p-3 text-sm leading-6 text-muted-foreground">
              <b className="text-foreground">{recommended.name}</b>
              <br />
              <span className="font-medium text-foreground">{recommended.highlight}</span>
              <span className="text-muted-foreground"> - giao dự kiến {recommended.delivery}.</span>
            </div>
            <div className="mt-4 grid gap-3">
              <ModalButton
                onClick={() => {
                  onSelect(recommended);
                  onClose();
                }}
              >
                Dùng chi nhánh này
              </ModalButton>
              <ModalButton variant="secondary" onClick={onClose}>
                Tiếp tục xem menu
              </ModalButton>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
