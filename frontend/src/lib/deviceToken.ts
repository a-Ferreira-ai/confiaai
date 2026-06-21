const STORAGE_KEY = "confia_device_token";

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getDeviceToken(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const token = generateUuid();
  localStorage.setItem(STORAGE_KEY, token);
  return token;
}
