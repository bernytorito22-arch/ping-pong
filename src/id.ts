const CHARSET = "23456789abcdefghjkmnpqrstuvwxyz";

export function newRoomId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]!).join("");
}
