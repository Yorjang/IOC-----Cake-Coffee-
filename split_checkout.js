const fs = require('fs');

const lines = fs.readFileSync('E-Commerce---FE/src/app/pages/Checkout.tsx', 'utf8').split('\n');
const successIndex = lines.findIndex(l => l.startsWith('export function Success('));

const checkoutLines = lines.slice(0, successIndex);
const successLines = lines.slice(successIndex);

// Rewrite Checkout.tsx
const newCheckout = `import { useState, useEffect } from "react";
import { Truck, CreditCard, Store, MapPin, ShieldAlert, Clock, Crosshair, CheckCircle2, Loader2 } from "lucide-react";
import { Btn } from "../components/shared";
import { CHECKOUT_CONFIG } from "../../config/appConfig";
import { useCheckout } from "../features/checkout/hooks/useCheckout";
import { formatPrice } from "../../utils/currency"; // we'll use inline formatPrice if it doesn't exist

const formatPriceLocal = (price: number) => price.toLocaleString("vi-VN") + "đ";

export function Checkout(props: any) {
  const {
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
  } = useCheckout(props);

  const { cart, subtotal, discount, shipping, grandTotal } = props;

${checkoutLines.slice(checkoutLines.findIndex(l => l.trim().startsWith('return ('))).join('\n')}
`;

// Rewrite Success.tsx
const newSuccess = `import { useState, useEffect } from "react";
import { ClipboardList, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parseRes } from "../../utils/api";
import { env } from "../../config/env";
import { getAccessToken } from "../components/authSession";
import { Btn } from "../components/shared";

${successLines.join('\n')}
`;

fs.writeFileSync('E-Commerce---FE/src/app/pages/Checkout.tsx', newCheckout);
fs.writeFileSync('E-Commerce---FE/src/app/pages/Success.tsx', newSuccess);
console.log('Successfully split Checkout.tsx and Success.tsx');
