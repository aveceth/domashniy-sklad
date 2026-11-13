// Общие чистые функции: сортировка по началу ориентировочного диапазона и исключение демо-расходов.
export function priorityDate(product) {
  return (product.isEstimated && product.expiryMinDate) || product.expiryDate || null;
}
export function byPriorityDate(a, b) {
  return (priorityDate(a) || '9999-12-31').localeCompare(priorityDate(b) || '9999-12-31') ||
    String(a.name || '').localeCompare(String(b.name || ''), 'ru');
}
export function isDemoPurchase(event, products) {
  if (event.isDemo === true) return true;
  if (event.type !== 'purchase' || event.isDemo === false) return false;
  // В старых версиях флаг отсутствовал. Сопоставляем исключительно с
  // демонстрационной партией, созданной одновременно с событием.
  return products.some(product => product.isDemo === true &&
    product.name === event.name &&
    product.purchaseDate === event.date &&
    Number.isFinite(Number(event.createdAt)) &&
    Number.isFinite(Number(product.createdAt)) &&
    Math.abs(Number(event.createdAt) - Number(product.createdAt)) <= 15000 &&
    Math.abs(Number(event.amount) - Number(product.unitPrice) * Number(event.quantity)) < 0.02);
}
