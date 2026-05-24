'use client';

import { useRef, useState, type ReactNode } from 'react';

interface Action {
  label: string;
  icon: ReactNode;
  color: string;
  bg: string;
  onClick: () => void;
}

interface Props {
  children: ReactNode;
  actions: Action[];
  threshold?: number;
}

export function SwipeableRow({ children, actions, threshold = 72 }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragging = useRef(false);
  const isHorizontal = useRef<boolean | null>(null);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const actionsWidth = actions.length * 72;

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
    isHorizontal.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!isDragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (isHorizontal.current === null) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return;

    e.preventDefault();
    const base = open ? -actionsWidth : 0;
    const raw = base + dx;
    const clamped = Math.max(-actionsWidth, Math.min(0, raw));
    setOffset(clamped);
  }

  function onTouchEnd() {
    if (!isDragging.current) return;
    isDragging.current = false;
    const midpoint = -actionsWidth / 2;
    if (offset < midpoint) {
      setOffset(-actionsWidth);
      setOpen(true);
    } else {
      setOffset(0);
      setOpen(false);
    }
    isHorizontal.current = null;
  }

  function close() {
    setOffset(0);
    setOpen(false);
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Action buttons revealed on swipe */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: actionsWidth, display: 'flex',
      }}>
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => { close(); a.onClick(); }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              background: a.bg, color: a.color,
              border: 'none', fontSize: 10, fontWeight: 600,
            }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* Row content */}
      <div
        ref={trackRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging.current ? 'none' : 'transform 220ms ease',
          position: 'relative', zIndex: 1,
          background: 'var(--surface)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
