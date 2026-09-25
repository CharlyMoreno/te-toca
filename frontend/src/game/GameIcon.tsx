import type { CSSProperties } from 'react'
export type IconName = 'home'|'kitchen'|'bathroom'|'bedroom'|'living'|'tasks'|'plus'|'menu'|'trophy'|'people'|'avatar'|'history'|'view'|'exit'|'settings'
const paths: Record<IconName, string> = {
  home: 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8',
  kitchen: 'M5 3v6a3 3 0 0 0 6 0V3M8 3v18M18 3c-3 3-3 8 0 9h2V3h-2Zm2 9v9',
  bathroom: 'M3 12h18v4a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-4Zm2 0V5a2 2 0 0 1 4 0M7 20v2m10-2v2M8 6h3',
  bedroom: 'M3 18v3m18-3v3M3 11h18v7H3v-7Zm2 0V5h14v6M7 8h3m4 0h3',
  living: 'M5 12V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4M5 12a2 2 0 0 0-4 0v6h22v-6a2 2 0 0 0-4 0v2H5v-2Zm-2 6v3m18-3v3',
  tasks: 'M9 5h12M9 12h12M9 19h12M2 5l2 2 3-4M2 12l2 2 3-4M2 19l2 2 3-4',
  plus: 'M12 4v16M4 12h16',
  menu: 'M4 6h16M4 12h16M4 18h16',
  trophy: 'M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8',
  people: 'M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-6 10v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v3',
  avatar: 'M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-9 9a9 9 0 0 1 18 0',
  history: 'M3 10a9 9 0 1 1 1 8M3 3v7h7m2-4v6l4 3',
  view: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  exit: 'M10 3H4v18h6m5-14 5 5-5 5m-7-5h12',
  settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
}
export default function GameIcon({ name, style }: {name:IconName;style?:CSSProperties}) {
  return <svg style={style} className="game-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}
