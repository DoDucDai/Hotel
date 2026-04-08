export function normalizePaymentInstructions(payload) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }

  return {};
}

export function getPaymentMethodLabel(method) {
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
  return method === "E_WALLET" ? "Số ví / SĐT" : "Số tài khoản";
}

export function getPaymentProviderLabel(method) {
  return method === "E_WALLET" ? "Ví điện tử" : "Ngân hàng";
}
