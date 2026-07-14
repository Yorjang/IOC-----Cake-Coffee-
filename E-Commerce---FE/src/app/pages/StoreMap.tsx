import { useState, useEffect } from "react";
import { ArrowUpRight, MapPin, Search, Clock, Phone, Navigation } from "lucide-react";

export function StoreMap({ branches, activeStoreId, onSelectStore }: any) {
  const [activeBranchId, setActiveBranchId] = useState<string | null>(activeStoreId || null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!activeBranchId && branches.length > 0) {
      setActiveBranchId(activeStoreId || branches[0].id);
    }
  }, [branches, activeStoreId, activeBranchId]);

  const activeBranch = branches.find((b: any) => b.id === activeBranchId) || branches[0];
  const mapSrc = activeBranch
    ? `https://www.google.com/maps?q=${encodeURIComponent(activeBranch.address)}&output=embed`
    : "";

  const filteredBranches = branches.filter((b: any) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-[1500px] px-5 sm:px-6 lg:px-10 py-6 md:py-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hệ thống cửa hàng</h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            Tìm kiếm và xem bản đồ đường đi tới các chi nhánh của Sweet Bean Coffee trên toàn quốc.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-0 lg:gap-6 rounded-2xl bg-card border shadow-sm overflow-hidden h-[500px] lg:h-[550px]">
        {/* Sidebar */}
        <div className="flex flex-col border-r bg-card/50 min-h-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc địa chỉ..."
                className="w-full pl-10 pr-4 py-2.5 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              Tìm thấy {filteredBranches.length} cửa hàng
            </p>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 custom-scrollbar">
            {filteredBranches.map((branch: any) => {
              const isActive = branch.id === activeBranchId;
              return (
                <button
                  key={branch.id}
                  onClick={() => setActiveBranchId(branch.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 border ${
                    isActive 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-background border-transparent hover:border-border hover:bg-card hover:shadow-sm"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-0.5 shrink-0 p-2 rounded-full ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h3 className={`font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                        {branch.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {branch.address}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Clock size={14} />07:00 - 22:00</span>
                        {branch.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{branch.phone}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            
            {filteredBranches.length === 0 && (
              <div className="py-12 text-center">
                <MapPin size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Không tìm thấy cửa hàng nào phù hợp.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="relative bg-muted/30 flex flex-col">
          {activeBranch ? (
            <>
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={() => {
                    if (activeBranch) {
                      window.open(`https://www.google.com/maps?q=${encodeURIComponent(activeBranch.address)}`, "_blank");
                    }
                  }}
                  className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-background transition-all hover:scale-105 active:scale-95"
                >
                  <Navigation size={16} className="text-primary" />
                  Chỉ đường
                  <ArrowUpRight size={14} className="text-muted-foreground ml-1" />
                </button>
              </div>
              <iframe
                title="Bản đồ chi nhánh Sweet Bean"
                src={mapSrc}
                className="w-full h-[400px] lg:h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {/* Bottom Info Bar on Mobile/Tablet */}
              <div className="bg-background border-t p-4 lg:hidden">
                <h3 className="font-bold text-lg">{activeBranch.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{activeBranch.address}</p>
                
                <button
                  onClick={() => onSelectStore(activeBranch)}
                  className="mt-4 w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <MapPin size={16} />
                  Chọn làm cửa hàng hiện tại
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <MapPin size={48} className="text-muted-foreground/20 mb-4" />
              <p className="text-lg font-medium">Chưa chọn cửa hàng</p>
              <p className="text-sm mt-1">Vui lòng chọn một chi nhánh từ danh sách bên trái để xem bản đồ.</p>
            </div>
          )}
          
          {/* Desktop Select Store Button Overlay */}
          {activeBranch && (
            <div className="hidden lg:block absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={() => onSelectStore(activeBranch)}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <MapPin size={18} />
                Chọn cửa hàng này để đặt món
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
