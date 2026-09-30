import { DownloadIcon } from '@primer/octicons-react';
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type Position = { x: number; y: number };

type MenuItem = {
  label: string;
  href: string;
  filename: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Download logo as .svg',
    href: '/brand/farcaster-icon.svg',
    filename: 'farcaster-icon.svg',
  },
  {
    label: 'Download wordmark as .svg',
    href: '/brand/farcaster-combo.svg',
    filename: 'farcaster-combo.svg',
  },
];

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type LogoBrandContextMenuProps = {
  children: ReactNode;
};

const LogoBrandContextMenu: FC<LogoBrandContextMenuProps> = ({ children }) => {
  const [position, setPosition] = useState<Position | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const triggerFocusRef = useRef<HTMLElement | null>(null);

  const open = position !== null;

  const restoreTriggerFocus = useCallback(() => {
    const target = triggerFocusRef.current;
    triggerFocusRef.current = null;
    if (target && target !== document.body) {
      target.focus?.();
    }
  }, []);

  const close = useCallback(() => setPosition(null), []);

  const closeAndRestoreFocus = useCallback(() => {
    restoreTriggerFocus();
    setPosition(null);
  }, [restoreTriggerFocus]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    triggerFocusRef.current =
      (document.activeElement as HTMLElement | null) ?? null;
    setPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const focusItem = useCallback((index: number) => {
    const items = itemsRef.current.filter(
      (el): el is HTMLButtonElement => el !== null,
    );
    if (items.length === 0) {
      return;
    }
    const count = items.length;
    const normalized = ((index % count) + count) % count;
    items[normalized]?.focus();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    focusItem(0);

    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) {
        return;
      }
      // Outside click: the click will land on whatever the user picked
      // and take focus naturally — don't restore focus to the trigger.
      triggerFocusRef.current = null;
      close();
    };
    const onScroll = () => close();
    const onResize = () => close();

    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, close, focusItem]);

  const onMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const items = itemsRef.current.filter(
        (el): el is HTMLButtonElement => el !== null,
      );
      if (items.length === 0) {
        return;
      }
      const activeIndex = items.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const current = activeIndex === -1 ? 0 : activeIndex;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          closeAndRestoreFocus();
          break;
        case 'Tab':
          // Let the browser advance focus naturally — only close the
          // menu so focus doesn't get stranded on a soon-to-unmount item.
          close();
          break;
        case 'ArrowDown':
          e.preventDefault();
          focusItem(current + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          focusItem(current - 1);
          break;
        case 'Home':
          e.preventDefault();
          focusItem(0);
          break;
        case 'End':
          e.preventDefault();
          focusItem(items.length - 1);
          break;
        default:
          break;
      }
    },
    [close, closeAndRestoreFocus, focusItem],
  );

  useLayoutEffect(() => {
    if (!position || !menuRef.current) {
      return;
    }
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    const maxX = window.innerWidth - rect.width - padding;
    const maxY = window.innerHeight - rect.height - padding;
    const clampedX = Math.min(position.x, Math.max(padding, maxX));
    const clampedY = Math.min(position.y, Math.max(padding, maxY));
    if (clampedX !== position.x || clampedY !== position.y) {
      setPosition({ x: clampedX, y: clampedY });
    }
  }, [position]);

  return (
    <>
      {/*
        `display: contents` keeps the wrapper out of layout, so this
        component can be placed *around* a focusable child (e.g. a link)
        without disrupting flex/grid sizing. Crucially, that placement
        means a contextmenu event fired on the focused child via
        Shift+F10 / Menu key bubbles up to `onContextMenu` here.
      */}
      <div onContextMenu={handleContextMenu} style={{ display: 'contents' }}>
        {children}
      </div>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label="Farcaster brand assets"
            tabIndex={-1}
            onKeyDown={onMenuKeyDown}
            style={{ top: position.y, left: position.x }}
            className="outline-hidden fixed z-50 min-w-[220px] rounded-md border py-1 shadow-lg bg-app border-default"
          >
            {MENU_ITEMS.map((item, index) => (
              <button
                key={item.filename}
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  triggerDownload(item.href, item.filename);
                  closeAndRestoreFocus();
                }}
                className="flex w-full flex-row items-center gap-2 px-3 py-2 text-left text-sm hover:bg-overlay-medium focus:bg-overlay-medium"
              >
                <DownloadIcon size="small" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

export { LogoBrandContextMenu };
