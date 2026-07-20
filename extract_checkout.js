const fs = require('fs');

const sourcePath = 'E-Commerce---FE/src/app/pages/Checkout.tsx';
const lines = fs.readFileSync(sourcePath, 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes('export function Checkout({ cart'));
const returnIndex = lines.findIndex(l => l.trim().startsWith('return (') && l.length < 20);

const hookLines = lines.slice(startIndex + 1, returnIndex);

const correctImports = `import { useState, useEffect } from "react";
import { toast } from "sonner";
import { parseRes } from "../../../../utils/api";
import { env } from "../../../../config/env";
import { VIEW_KEYS } from "../../../../config/appConfig";
`;

let hookCode = `${correctImports}

export function useCheckout({ cart, setView, onPlaceOrder, user }: any) {
${hookLines.join('\n')}

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
`;

fs.writeFileSync('E-Commerce---FE/src/app/features/checkout/hooks/useCheckout.ts', hookCode);
console.log('Created useCheckout.ts');
