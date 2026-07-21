import { useState, useEffect } from "react";
import { toast } from "sonner";
import { parseRes } from "../../../../utils/api";
import { env } from "../../../../config/env";
import { VIEW_KEYS } from "../../../../config/appConfig";


export function useCheckout({ cart, setView, onPlaceOrder, user }: any) {
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [name, setName] = useState(user?.fullName || user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethodText, setPaymentMethodText] = useState("Thanh toán khi nhận hàng (COD)");

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [hasCustomerLocation, setHasCustomerLocation] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // useEffect(() => {
  //   if (!cart || cart.length === 0) {
  //     toast.error("Giỏ hàng trống! Không thể thực hiện thanh toán.");
  //     setView(VIEW_KEYS.HOME);
  //   }
  // }, [cart, setView]);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        let endpoint = `${env.API_URL}/branches/active`;
        if ("geolocation" in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 7000,
                maximumAge: 300000,
              }),
            );
            endpoint = `${env.API_URL}/branches/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}`;
            setHasCustomerLocation(true);
          } catch {
            setHasCustomerLocation(false);
          }
        }

        let res = await fetch(endpoint);
        if (!res.ok && endpoint.includes("/nearby")) {
          setHasCustomerLocation(false);
          res = await fetch(`${env.API_URL}/branches/active`);
        }
        if (!res.ok) throw new Error("Không thể tải danh sách chi nhánh");

        const data = await parseRes(res);
        const openBranches = (Array.isArray(data) ? data : [data]).filter(branch => branch.isOpenNow);
        setBranches(openBranches);
        setSelectedBranchId(openBranches[0]?.id || "");
      } catch (err) {
        console.error("Error fetching branches:", err);
        setBranches([]);
        setSelectedBranchId("");
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const handleCheckout = async (e: any) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!name.trim() || !phone.trim()) {
      const err = "Vui lòng điền họ tên và số điện thoại người nhận!";
      setCheckoutError(err);
      toast.error(err);
      return;
    }

    if (fulfillmentType === "delivery" && !address.trim()) {
      const err = "Vui lòng nhập địa chỉ giao hàng!";
      setCheckoutError(err);
      toast.error(err);
      return;
    }

    if (!selectedBranchId) {
      const err = "Hiện không có chi nhánh đang mở để tiếp nhận đơn hàng!";
      setCheckoutError(err);
      toast.error(err);
      return;
    }

    // Map payment method text to DB enum
    let paymentMethod = "cod";
    if (paymentMethodText === "Chuyển khoản ngân hàng") {
      paymentMethod = "bank_transfer";
    } else if (paymentMethodText === "Ví Momo") {
      paymentMethod = "momo";
    }

    const finalBranchId = selectedBranchId;

    try {
      await onPlaceOrder({
        branchId: finalBranchId,
        fulfillmentType,
        shippingRecipientName: name,
        shippingAddressPhone: phone,
        shippingAddressStreet: fulfillmentType === "delivery" ? address : "",
        paymentMethod,
        note
      });
    } catch (err: any) {
      setCheckoutError(err.message || "Lỗi khi gửi đơn hàng lên máy chủ.");
    }
  };


  return {
    fulfillmentType, setFulfillmentType,
    name, setName,
    phone, setPhone,
    address, setAddress,
    selectedBranchId, setSelectedBranchId,
    note, setNote,
    paymentMethodText, setPaymentMethodText,
    branches,
    loadingBranches,
    hasCustomerLocation,
    checkoutError, setCheckoutError,
    handleCheckout
  };
}
