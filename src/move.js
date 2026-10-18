// One-time move from the old workers.dev address to the custom domain (see ADR 006).
// Browser storage belongs to one address, so the old address hands its export to the new one
// in the URL fragment (after #), which browsers never send to a server.

export const NEW_ORIGIN = "https://time.mohamedyoussef.dev";
export const HANDOFF_PREFIX = "#import=";

export function isOldAddress(hostname) {
  return hostname.endsWith(".workers.dev");
}

// UTF-8 safe base64url, so project names and notes in any language survive the trip.
export function encodeHandoff(json) {
  let binary = "";
  for (const byte of new TextEncoder().encode(json)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeHandoff(encoded) {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

export function handoffUrl(json) {
  return `${NEW_ORIGIN}/${HANDOFF_PREFIX}${encodeHandoff(json)}`;
}
