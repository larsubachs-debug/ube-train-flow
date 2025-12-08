import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlOrMeta = shortcut.ctrlKey || shortcut.metaKey;
        const isCtrlOrMetaPressed = event.ctrlKey || event.metaKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (ctrlOrMeta ? isCtrlOrMetaPressed : !isCtrlOrMetaPressed) &&
          (shortcut.shiftKey ? event.shiftKey : !event.shiftKey) &&
          (shortcut.altKey ? event.altKey : !event.altKey)
        ) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

// Global navigation shortcuts hook
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'h',
      altKey: true,
      action: () => navigate('/'),
      description: 'Ga naar Home',
    },
    {
      key: 'p',
      altKey: true,
      action: () => navigate('/programs'),
      description: 'Ga naar Programma\'s',
    },
    {
      key: 'd',
      altKey: true,
      action: () => navigate('/dashboard'),
      description: 'Ga naar Dashboard',
    },
    {
      key: 'c',
      altKey: true,
      action: () => navigate('/chat'),
      description: 'Ga naar Chat',
    },
    {
      key: 'a',
      altKey: true,
      action: () => navigate('/account'),
      description: 'Ga naar Account',
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus zoekveld',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
