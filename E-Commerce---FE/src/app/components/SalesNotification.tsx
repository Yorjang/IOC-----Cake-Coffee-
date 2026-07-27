import { useEffect, useState } from "react";

export function SalesNotification({ 
  products, 
  onSelectProduct 
}: { 
  products: any[]; 
  onSelectProduct: (product: any) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  useEffect(() => {
    if (!products || products.length === 0) return;

    let showTimer: number;
    let hideTimer: number;

    const cycleNotification = () => {
      // Chọn một sản phẩm ngẫu nhiên
      const randomIndex = Math.floor(Math.random() * products.length);
      setCurrentProduct(products[randomIndex]);
      setVisible(true);

      // Hiển thị trong 10 giây, sau đó ẩn đi
      showTimer = window.setTimeout(() => {
        setVisible(false);
        // Ẩn trong 20 giây, sau đó hiển thị lại (10 + 20 = 30)
        hideTimer = window.setTimeout(() => {
          cycleNotification();
        }, 20000);
      }, 10000);
    };

    // Bắt đầu vòng lặp đầu tiên sau 5 giây để trang có thời gian tải xong
    const initialTimer = window.setTimeout(() => {
      cycleNotification();
    }, 5000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [products]);

  if (!currentProduct) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-[60] transition-all duration-700 ease-in-out transform ${
        visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none"
      }`}
      style={{ maxWidth: "320px", width: "calc(100vw - 2rem)" }}
    >
      <div 
        className="bg-background border border-border shadow-2xl rounded-xl p-3 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onSelectProduct(currentProduct)}
      >
        <div className="relative flex-shrink-0">
          <img 
            src={currentProduct[3]} 
            alt={currentProduct[0]} 
            className="w-16 h-16 object-cover rounded-lg shadow-sm"
          />
          <span className="absolute -top-2 -right-2 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
          </span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs text-primary font-medium mb-0.5">Khách hàng vừa đặt mua</span>
          <span className="text-sm font-semibold truncate leading-tight">{currentProduct[0]}</span>
          <span className="text-sm text-muted-foreground mt-0.5 font-medium">{currentProduct[1]}</span>
        </div>
      </div>
    </div>
  );
}
