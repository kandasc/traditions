/** Fired after cart mutations so UI (e.g. header badge) can refresh. */
export function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("traditions:cart"));
  }
}
