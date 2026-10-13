const DEVICE_AUTH_KEY = "flowboc:has-authed";

export function markDeviceAuthed() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEVICE_AUTH_KEY, "1");
}

export function hasDeviceAuthed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEVICE_AUTH_KEY) === "1";
}
