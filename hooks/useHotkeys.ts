
import { useEffect } from 'react';

type HotkeyCallback = (event: KeyboardEvent) => void;
type HotkeyMap = Record<string, HotkeyCallback>;

export function useHotkeys(hotkeys: HotkeyMap, deps: any[] = []) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifier = event.metaKey || event.ctrlKey ? 'mod+' : '';
      const hotkey = `${modifier}${key}`;
      
      if (hotkeys[hotkey]) {
        event.preventDefault();
        hotkeys[hotkey](event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkeys, ...deps]);
}
