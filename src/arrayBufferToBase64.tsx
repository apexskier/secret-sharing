export function base64ToArrayBuffer(message: string): ArrayBuffer {
  return Uint8Array.from(atob(message), (c) => c.charCodeAt(0));
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
