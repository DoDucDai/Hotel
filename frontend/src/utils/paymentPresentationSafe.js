export function normalizePaymentInstructions(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }

  return {};
}

const PAYMENT_METHOD_LABELS = {
  BANK_TRANSFER: "Chuy\u1ec3n kho\u1ea3n ng\u00e2n h\u00e0ng",
  E_WALLET: "V\u00ed \u0111i\u1ec7n t\u1eed",
  PAY_AT_HOTEL: "Thanh to\u00e1n t\u1ea1i kh\u00e1ch s\u1ea1n",
};

const PAYMENT_ACCOUNT_LABELS = {
  E_WALLET: "S\u1ed1 v\u00ed / S\u0110T",
  BANK_TRANSFER: "S\u1ed1 t\u00e0i kho\u1ea3n",
  PAY_AT_HOTEL: "S\u1ed1 t\u00e0i kho\u1ea3n",
};

const PAYMENT_PROVIDER_LABELS = {
  E_WALLET: "V\u00ed \u0111i\u1ec7n t\u1eed",
  BANK_TRANSFER: "Ng\u00e2n h\u00e0ng",
  PAY_AT_HOTEL: "Ng\u00e2n h\u00e0ng",
};

export function getPaymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] || "-";
}

export function getPaymentAccountLabel(method) {
  return PAYMENT_ACCOUNT_LABELS[method] || PAYMENT_ACCOUNT_LABELS.BANK_TRANSFER;
}

export function getPaymentProviderLabel(method) {
  return PAYMENT_PROVIDER_LABELS[method] || PAYMENT_PROVIDER_LABELS.BANK_TRANSFER;
}
