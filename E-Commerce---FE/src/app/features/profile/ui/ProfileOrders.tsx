import { useEffect, useState } from "react";
import { parseRes } from "../../../../utils/api";
import { getAccessToken } from "../../../components/authSession";
import { env } from "../../../../config/env";

export function ProfileOrders({ setView }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [orderTab, setOrderTab] = useState<"active" | "history">("active");
  const ITEMS_PER_PAGE = 5;

  const fetchMyOrders = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`${env.API_URL}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await parseRes(res);
        setOrders(data);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error fetching my orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();

    const interval = setInterval(() => {
      fetchMyOrders();
    }, 4000);

    const handleFocus = () => {
      fetchMyOrders();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [orderTab]);

  return (
    <div className="space-y-6">
      <div className="border-b pb-3 mb-4">
        <h3 className="text-xl font-bold font-serif">Đơn hàng của tôi</h3>
        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => { setOrderTab("active"); setCurrentPage(1); }}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${orderTab === "active" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Đang xử lý
          </button>
          <button 
            onClick={() => { setOrderTab("history"); setCurrentPage(1); }}
            className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${orderTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Đã hoàn tất
          </button>
        </div>
      </div>

      {loadingOrders ? (
        <div className="text-center py-10 text-muted-foreground">
          Đang tải danh sách đơn hàng...
        </div>
      ) : (
        <div className="space-y-4">
          {(() => {
            const filteredOrders = orders.filter(o => 
              orderTab === "active" 
                ? !['completed', 'cancelled'].includes(o.orderStatus)
                : ['completed', 'cancelled'].includes(o.orderStatus)
            );

            if (filteredOrders.length === 0) {
              return (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">
                    {orderTab === "active" ? "Bạn không có đơn hàng nào đang xử lý." : "Bạn chưa có đơn hàng nào hoàn tất."}
                  </p>
                </div>
              );
            }

            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
            const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

            return (
              <>
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                  {paginatedOrders.map((o) => {
                  const itemsStr = o.items
              ?.map((i: any) => `${i.quantity}x ${i.productName} (${i.variantName})`)
              .join(", ") || "Không có sản phẩm";

            const dateStr = new Date(o.createdAt).toLocaleDateString("vi-VN");
            const priceStr = Number(o.totalAmount).toLocaleString("vi-VN") + "đ";

            const statusColors: Record<string, string> = {
              pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
              confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              preparing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
              shipping: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            };

            const getStatusLabel = (status: string) => {
              const map: Record<string, string> = {
                pending: "Chờ xác nhận",
                confirmed: "Đã xác nhận",
                preparing: "Đang chuẩn bị",
                shipping: "Đang giao hàng",
                completed: "Đã hoàn thành",
                cancelled: "Đã hủy"
              };
              return map[status] || status;
            };

            return (
              <div
                key={o.id}
                className="border bg-secondary/20 py-2.5 px-3.5 rounded-lg text-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition hover:bg-secondary/40"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{o.orderCode}</span>
                    <span className="text-muted-foreground text-xs">• {dateStr}</span>
                  </div>
                  <p className="text-foreground/90 font-medium">{itemsStr}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                  <p className="font-bold text-foreground">{priceStr}</p>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      statusColors[o.orderStatus] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {getStatusLabel(o.orderStatus)}
                  </span>
                  {o.orderStatus !== 'cancelled' && (() => {
                    const needsPayment = 
                      o.paymentStatus === 'pending' && 
                      !['cod', 'cash'].includes(o.paymentMethod);
                    
                    if (needsPayment) {
                      return (
                        <button
                          onClick={() => setView("Thanh toán đơn hàng", o.id)}
                          className="mt-2 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                        >
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          Thanh toán đơn hàng
                        </button>
                      );
                    }
                    
                    const isCompleted = o.orderStatus === 'completed';
                    const hasUnreviewedItems = o.items?.some((item: any) => !item.isReviewed);
                    
                    return (
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 mt-2">
                        {isCompleted && hasUnreviewedItems && (
                          <button
                            onClick={() => setView("Theo dõi", o.id)}
                            className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                          >
                            ⭐ Đánh giá ngay
                          </button>
                        )}
                        <button
                          onClick={() => setView("Theo dõi", o.id)}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Theo dõi đơn
                        </button>
                      </div>
                    );
                  })()}

                </div>
              </div>
            );
          })}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4 border-t mt-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Trước
              </button>
              <span className="text-sm font-medium text-muted-foreground mx-3">
                Trang {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Sau
              </button>
            </div>
          )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
