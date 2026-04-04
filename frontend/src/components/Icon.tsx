/**
 * Lightweight SVG icon set — replaces emojis throughout the app.
 * All icons are 1em × 1em by default, inherit currentColor.
 */

type Props = {
  name: IconName;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

export type IconName =
  | 'shield' | 'home' | 'policy' | 'claims' | 'profile' | 'sim'
  | 'check' | 'x' | 'alert' | 'info' | 'refresh'
  | 'chevron-down' | 'chevron-right'
  | 'rain' | 'sun' | 'aqi' | 'traffic' | 'fire' | 'fog' | 'storm' | 'flood'
  | 'phone' | 'platform' | 'clock' | 'map' | 'calendar'
  | 'star' | 'zap' | 'wifi-off' | 'bar-chart' | 'trends'
  | 'users' | 'clipboard' | 'activity' | 'log-out' | 'lock'
  | 'arrow-right' | 'plus' | 'minus' | 'eye'
  | 'coin' | 'wallet' | 'payout' | 'tier'
  | 'dot-live' | 'admin' | 'grid';

const PATHS: Record<IconName, React.ReactNode> = {
  shield: <path d="M12 2l9 4v6c0 5.25-3.83 10.15-9 11.5C6.83 22.15 3 17.25 3 12V6l9-4z" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/>,
  home: <><path d="M3 12L12 3l9 9" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V12h6v9" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12v9h18V12" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  policy: <><rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M9 8h6M9 12h6M9 16h4" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  claims: <><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/><rect x="9" y="3" width="6" height="4" rx="1" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M9 12l2 2 4-4" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  profile: <><circle cx="12" cy="8" r="4" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  sim: <><path d="M4 6h16M4 12h10M4 18h6" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/><circle cx="17" cy="17" r="4" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M21 21l-2-2" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  check: <path d="M20 6L9 17l-5-5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  x: <><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="currentColor"/></>,
  info: <><circle cx="12" cy="12" r="9" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M12 8v4M12 16h.01" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/></>,
  refresh: <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  'chevron-down': <path d="M6 9l6 6 6-6" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  'chevron-right': <path d="M9 6l6 6-6 6" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  rain: <><path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 15.25" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/><line x1="8" y1="19" x2="8" y2="21" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><line x1="12" y1="21" x2="12" y2="23" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><line x1="16" y1="19" x2="16" y2="21" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/></>,
  sun: <><circle cx="12" cy="12" r="4" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  aqi: <><path d="M12 2a7 7 0 017 7c0 4-7 13-7 13S5 13 5 9a7 7 0 017-7z" strokeWidth="1.8" stroke="currentColor" fill="none"/><circle cx="12" cy="9" r="2.5" strokeWidth="1.8" stroke="currentColor" fill="none"/></>,
  traffic: <><rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="1.8" stroke="currentColor" fill="none"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/></>,
  fire: <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  fog: <><path d="M5 5h14M3 9h18M5 13h14M3 17h18" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  storm: <><path d="M19 16.9A5 5 0 0018 7h-1.26a8 8 0 10-11.62 9" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/><polyline points="13 11 9 17 15 17 11 23" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  flood: <><path d="M2 12h20" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/><path d="M2 16c1.5-2 3-3 5-3s3.5 1 5 3 3.5 3 5 3" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/><path d="M3 6l2-2h14l2 2" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  phone: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.81 19.79 19.79 0 012 2.18 2 2 0 014 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/></>,
  platform: <><rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M8 21h8M12 17v4" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  clock: <><circle cx="12" cy="12" r="9" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M12 7v5l3 3" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="18" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><line x1="16" y1="6" x2="16" y2="22" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8" stroke="currentColor" fill="none"/><line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/></>,
  'wifi-off': <><line x1="1" y1="1" x2="23" y2="23" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.8M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  'bar-chart': <><line x1="18" y1="20" x2="18" y2="10" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><line x1="12" y1="20" x2="12" y2="4" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="14" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/></>,
  trends: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17 6 23 6 23 12" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" strokeWidth="1.8" stroke="currentColor" fill="none"/><rect x="8" y="2" width="8" height="4" rx="1" strokeWidth="1.8" stroke="currentColor" fill="none"/></>,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
  'log-out': <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round"/></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  'arrow-right': <><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" stroke="currentColor" strokeLinecap="round"/><polyline points="12 5 19 12 12 19" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" stroke="currentColor" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" stroke="currentColor" strokeLinecap="round"/></>,
  minus: <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" stroke="currentColor" strokeLinecap="round"/>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="1.8" stroke="currentColor" fill="none"/><circle cx="12" cy="12" r="3" strokeWidth="1.8" stroke="currentColor" fill="none"/></>,
  coin: <><circle cx="12" cy="12" r="9" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M14.5 9H11a1.5 1.5 0 000 3h2a1.5 1.5 0 010 3H9.5M12 7v2M12 15v2" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinecap="round"/></>,
  wallet: <><path d="M2 7a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M16 14a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/><path d="M2 10h20" strokeWidth="1.8" stroke="currentColor" fill="none"/></>,
  payout: <><path d="M12 2L2 7l10 5 10-5-10-5z" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/><path d="M2 17l10 5 10-5" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/><path d="M2 12l10 5 10-5" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/></>,
  tier: <><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/><path d="M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="1.8" stroke="currentColor" fill="none"/><path d="M21 3H3l3 6h12l3-6z" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/></>,
  'dot-live': <circle cx="12" cy="12" r="5" fill="currentColor"/>,
  admin: <><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" strokeWidth="1.8" stroke="currentColor" fill="none" strokeLinejoin="round"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" strokeWidth="1.8" stroke="currentColor" fill="none" rx="1"/><rect x="14" y="3" width="7" height="7" strokeWidth="1.8" stroke="currentColor" fill="none" rx="1"/><rect x="3" y="14" width="7" height="7" strokeWidth="1.8" stroke="currentColor" fill="none" rx="1"/><rect x="14" y="14" width="7" height="7" strokeWidth="1.8" stroke="currentColor" fill="none" rx="1"/></>,
};

export default function Icon({ name, size = 20, className, style }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
