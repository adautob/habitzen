
// src/lib/uuid.ts
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback básico para ambientes onde crypto.randomUUID não está disponível
  // ATENÇÃO: Este não é um UUID criptograficamente seguro.
  // Para a maioria dos casos de uso do lado do cliente, isso é suficiente.
  let d = new Date().getTime(); // Timestamp
  let d2 = (typeof performance !== 'undefined' && performance.now && (performance.now() * 1000)) || 0; // High-precision timer
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16; // Random number between 0 and 16
    if (d > 0) { // Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else { // Use high-precision timer if available
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
