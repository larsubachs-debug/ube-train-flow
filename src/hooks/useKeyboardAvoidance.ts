import { useEffect } from "react";

const isTextInput = (el: EventTarget | null): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
};

/**
 * Keeps focused inputs visible when the on-screen keyboard opens (mobile / native webview).
 * - Scrolls the focused element into view after a short delay (keyboard animation).
 */
export function useKeyboardAvoidance() {
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target;
      if (!isTextInput(target)) return;

      // Wait for keyboard animation / viewport resize
      window.setTimeout(() => {
        try {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch {
          // no-op
        }
      }, 350);
    };

    document.addEventListener("focusin", handler, { passive: true });
    return () => document.removeEventListener("focusin", handler);
  }, []);
}
