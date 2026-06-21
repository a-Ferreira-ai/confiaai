import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface TabItem {
  to: string;
  label: string;
  shortLabel: string;
  end?: boolean;
  icon: ReactNode;
}

const tabs: TabItem[] = [
  {
    to: "/",
    label: "Buscar",
    shortLabel: "Buscar",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3-3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/demanda",
    label: "Mapa de demanda",
    shortLabel: "Demanda",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" strokeLinejoin="round" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    to: "/ranking",
    label: "Ranking",
    shortLabel: "Ranking",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M4 20V10M10 20V4M16 20v-6M22 20H2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: "/favoritos",
    label: "Favoritos",
    shortLabel: "Favoritos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path
          d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-ink-light bg-ink pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex max-w-lg">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition sm:text-xs",
                  isActive ? "text-paper" : "text-on-ink-tertiary hover:text-on-ink-subtle",
                ].join(" ")
              }
            >
              {tab.icon}
              <span className="hidden min-[360px]:inline">{tab.label}</span>
              <span className="min-[360px]:hidden">{tab.shortLabel}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
