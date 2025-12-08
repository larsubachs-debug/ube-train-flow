// Keyboard navigation helpers
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  options: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }
) => {
  const { key } = event;

  switch (key) {
    case "Enter":
      if (options.onEnter) {
        event.preventDefault();
        options.onEnter();
      }
      break;
    case " ":
      if (options.onSpace) {
        event.preventDefault();
        options.onSpace();
      }
      break;
    case "Escape":
      if (options.onEscape) {
        event.preventDefault();
        options.onEscape();
      }
      break;
    case "ArrowUp":
      if (options.onArrowUp) {
        event.preventDefault();
        options.onArrowUp();
      }
      break;
    case "ArrowDown":
      if (options.onArrowDown) {
        event.preventDefault();
        options.onArrowDown();
      }
      break;
    case "ArrowLeft":
      if (options.onArrowLeft) {
        event.preventDefault();
        options.onArrowLeft();
      }
      break;
    case "ArrowRight":
      if (options.onArrowRight) {
        event.preventDefault();
        options.onArrowRight();
      }
      break;
  }
};

// Focus trap for modals/dialogs
export const createFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
  const focusableElements = containerRef.current?.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (!focusableElements || focusableElements.length === 0) return;

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKeyPress = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  document.addEventListener("keydown", handleTabKeyPress);

  return () => {
    document.removeEventListener("keydown", handleTabKeyPress);
  };
};

// Announce to screen readers
export const announceToScreenReader = (message: string, priority: "polite" | "assertive" = "polite") => {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Generate unique IDs for accessibility
let idCounter = 0;
export const generateA11yId = (prefix: string = "a11y") => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// Get motion-safe animation duration
export const getAnimationDuration = (normalDuration: number) => {
  return prefersReducedMotion() ? 0 : normalDuration;
};
