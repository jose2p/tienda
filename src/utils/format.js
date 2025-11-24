// src/utils/format.js

export function formatGuarani(valor) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    minimumFractionDigits: 0
  }).format(valor);
}
