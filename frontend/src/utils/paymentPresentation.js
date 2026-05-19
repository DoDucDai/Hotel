export function normalizePaymentInstructions(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }

  return {};
}

export function getPaymentMethodLabel(method) {
  const labels = {
    BANK_TRANSFER: "Chuyển khoản ngân hàng",
    E_WALLET: "Ví điện tử",
    PAY_AT_HOTEL: "Thanh toán tại khách sạn",
  };

  if (labels[method]) {
    return labels[method];
  }

  switch (method) {
    case "BANK_TRANSFER":
      return "Chuyển khoản ngân hàng";
    case "E_WALLET":
      return "Ví điện tử";
    case "PAY_AT_HOTEL":
      return "Thanh toán tại khách sạn";
    default:
      return "-";
  }
}

export function getPaymentAccountLabel(method) {
  const labels = {
    E_WALLET: "Số ví / SĐT",
    BANK_TRANSFER: "Số tài khoản",
    PAY_AT_HOTEL: "Số tài khoản",
  };

  if (labels[method]) {
    return labels[method];
  }

  return method === "E_WALLET" ? "Số ví / SĐT" : "Số tài khoản";
}

export function getPaymentProviderLabel(method) {
  const labels = {
    E_WALLET: "Ví điện tử",
    BANK_TRANSFER: "Ngân hàng",
    PAY_AT_HOTEL: "Ngân hàng",
  };

  if (labels[method]) {
    return labels[method];
  }

  return method === "E_WALLET" ? "Ví điện tử" : "Ngân hàng";
}
