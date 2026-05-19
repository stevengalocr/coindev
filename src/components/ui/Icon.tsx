'use client';

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
  className?: string;
}

export function Icon({ name, size = 20, stroke = 1.7, style, className }: IconProps) {
  const s = stroke;
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: s,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style,
    className,
  };

  switch (name) {
    case 'home': return <svg {...common}><path d="M4 11.5 12 5l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-7.5Z"/><path d="M10 20.5v-5h4v5"/></svg>;
    case 'list': return <svg {...common}><path d="M4 7h13"/><path d="M4 12h13"/><path d="M4 17h9"/><circle cx="20" cy="7" r="0.6" fill="currentColor"/><circle cx="20" cy="12" r="0.6" fill="currentColor"/><circle cx="16.5" cy="17" r="0.6" fill="currentColor"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14"/><path d="M5 12h14"/></svg>;
    case 'chart': return <svg {...common}><path d="M4 19h16"/><path d="M7 16V10"/><path d="M12 16V6"/><path d="M17 16v-8"/></svg>;
    case 'pulse': return <svg {...common}><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>;
    case 'wallet': return <svg {...common}><rect x="3.5" y="6.5" width="17" height="12" rx="2.5"/><path d="M16 12.5h2.5"/><path d="M3.5 9.5h17"/></svg>;
    case 'cart': return <svg {...common}><path d="M3 4h2l2.5 11h11l2-7H7"/><circle cx="9" cy="19" r="1.2"/><circle cx="17" cy="19" r="1.2"/></svg>;
    case 'car': return <svg {...common}><path d="M4 14V11l2-5h12l2 5v3"/><rect x="3" y="13" width="18" height="5" rx="1.5"/><circle cx="7" cy="18" r="1"/><circle cx="17" cy="18" r="1"/></svg>;
    case 'fork': return <svg {...common}><path d="M7 3v6a2 2 0 0 0 4 0V3"/><path d="M9 9v12"/><path d="M16 3c-1.7 0-3 2-3 5s1.3 5 3 5v8"/></svg>;
    case 'play': return <svg {...common}><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M10 9.5l5 2.5-5 2.5v-5Z" fill="currentColor"/></svg>;
    case 'bolt': return <svg {...common}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/></svg>;
    case 'spark': return <svg {...common}><path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m6 6 2.5 2.5"/><path d="m15.5 15.5 2.5 2.5"/><path d="m6 18 2.5-2.5"/><path d="m15.5 8.5 2.5-2.5"/></svg>;
    case 'laptop': return <svg {...common}><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h20"/></svg>;
    case 'card': return <svg {...common}><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 15h3"/></svg>;
    case 'bank': return <svg {...common}><path d="M3 9 12 4l9 5"/><path d="M5 9v8"/><path d="M9 9v8"/><path d="M15 9v8"/><path d="M19 9v8"/><path d="M3 19h18"/></svg>;
    case 'piggy': return <svg {...common}><path d="M17 9.5c1.5 0 2.5 1 2.5 2.5S18.5 14.5 17 14.5"/><path d="M5 8C3.5 9 3 10.5 3 12s.5 3 2 4l1 4h3l1-2h4l1 2h3l1-3.5C20 15 21 13.5 21 12c0-3-3-5.5-7-5.5C9.5 6.5 6.5 7 5 8Z"/><circle cx="9" cy="11" r="0.7" fill="currentColor"/></svg>;
    case 'cash': return <svg {...common}><rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="3"/><path d="M6 10v4"/><path d="M18 10v4"/></svg>;
    case 'cal': return <svg {...common}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 3v4"/><path d="M16 3v4"/></svg>;
    case 'filter': return <svg {...common}><path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/></svg>;
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg>;
    case 'arrow-up': return <svg {...common}><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>;
    case 'arrow-down': return <svg {...common}><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
    case 'arrow-left': return <svg {...common}><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></svg>;
    case 'check': return <svg {...common}><path d="m5 12 5 5 9-11"/></svg>;
    case 'x': return <svg {...common}><path d="m6 6 12 12"/><path d="m18 6-12 12"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'more': return <svg {...common}><circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>;
    case 'bell': return <svg {...common}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
    case 'settings': return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .3 1.8l.06.07a2 2 0 1 1-2.83 2.83l-.07-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.8.33l-.07.06a2 2 0 1 1-2.83-2.83l.06-.07A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.8l-.06-.07a2 2 0 1 1 2.83-2.83l.07.06a1.65 1.65 0 0 0 1.8.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.07-.06a2 2 0 1 1 2.83 2.83l-.06.07a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>;
    case 'flag': return <svg {...common}><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>;
    case 'shield': return <svg {...common}><path d="M12 3 4 6v6c0 4.5 3.5 7.5 8 9 4.5-1.5 8-4.5 8-9V6l-8-3Z"/></svg>;
    case 'globe': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 3 2.5 15 0 18"/><path d="M12 3c-2.5 3-2.5 15 0 18"/></svg>;
    case 'sun': return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 3v2"/><path d="M12 19v2"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="m5.5 5.5 1.4 1.4"/><path d="m17.1 17.1 1.4 1.4"/><path d="m5.5 18.5 1.4-1.4"/><path d="m17.1 6.9 1.4-1.4"/></svg>;
    case 'moon': return <svg {...common}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>;
    case 'eye': return <svg {...common}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'eye-off': return <svg {...common}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="m1 1 22 22"/></svg>;
    case 'logo': return (
      <svg {...common} viewBox="0 0 24 24">
        <defs>
          <linearGradient id="cd-logo-sw" x1="0" x2="1" y1="1" y2="0">
            <stop offset="0" stopColor="#5BE5D1"/>
            <stop offset="0.5" stopColor="#5B9BFF"/>
            <stop offset="1" stopColor="#9F7BFF"/>
          </linearGradient>
          <radialGradient id="cd-logo-coin" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#F8DD7C"/>
            <stop offset="0.5" stopColor="#F2C94C"/>
            <stop offset="1" stopColor="#A8800F"/>
          </radialGradient>
        </defs>
        <path d="M3 16c2.5 4 6 5 9 4s5-3 9-7" stroke="url(#cd-logo-sw)" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        <ellipse cx="12" cy="11" rx="5.2" ry="5.2" fill="url(#cd-logo-coin)"/>
        <path d="M12 7v8M10 9.5h3.5a1.4 1.4 0 0 1 0 2.8H10M10 13h4" stroke="#7a5a08" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      </svg>
    );
    case 'swap': return <svg {...common}><path d="M4 7h13"/><path d="m14 4 3 3-3 3"/><path d="M20 17H7"/><path d="m10 14-3 3 3 3"/></svg>;
    case 'target': return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>;
    case 'plane': return <svg {...common}><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/></svg>;
    case 'phone': return <svg {...common}><rect x="7" y="2" width="10" height="20" rx="2.5"/><circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none"/></svg>;
    case 'graduation': return <svg {...common}><path d="M22 9 12 4 2 9l10 5 10-5z"/><path d="M6 11.5v5c0 2 6 3.5 6 3.5s6-1.5 6-3.5v-5"/><line x1="22" y1="9" x2="22" y2="15"/></svg>;
    case 'ring': return <svg {...common}><path d="M6 3h12l2 5H4z"/><circle cx="12" cy="14" r="6"/></svg>;
    case 'umbrella': return <svg {...common}><path d="M23 12a11.05 11.05 0 0 0-22 0"/><path d="M12 12v5a2 2 0 0 0 4 0"/></svg>;
    case 'dumbbell': return <svg {...common}><path d="M6.5 6.5v11"/><path d="M17.5 6.5v11"/><path d="M3.5 9.5v5"/><path d="M20.5 9.5v5"/><path d="M6.5 12h11"/></svg>;
    case 'paw': return <svg {...common}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="4" cy="16" r="2"/><path d="M9 10c-3 2-5 5-5 8 0 2 2 4 8 4s8-2 8-4c0-3-2-6-5-8z"/></svg>;
    case 'guitar': return <svg {...common}><path d="M3.5 17.5 9 12"/><path d="M15 3l6 6-5 5c.6 2-.2 4.5-2.5 4.5-1 0-2.3-.6-3.3-1.5L9 14c-1-1-1.5-2.3-1.5-3.3 0-2.3 2.5-3.1 4.5-2.5z"/></svg>;
    case 'lock': return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'bar-chart': return <svg {...common}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="6"/></svg>;
  }
}
