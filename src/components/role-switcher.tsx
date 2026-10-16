"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, UserRound, Check } from "lucide-react";
import { switchRole } from "@/lib/actions";
import type { Role } from "@/lib/types";

/** Demo-only switcher to explore each portal (replaces sign-in for now). */
export function RoleSwitcher({ current, roles }: { current: Role; roles: { role: Role; label: string; who: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const active = roles.find((r) => r.role === current)!;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white pl-1.5 pr-3 text-sm hover:bg-zinc-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100">
          <UserRound className="h-4 w-4" />
        </span>
        <span className="hidden max-w-32 truncate lg:inline">{active.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <form action={switchRole} className="absolute right-0 z-50 mt-2 w-72 rounded-3xl border border-zinc-100 bg-white p-2 shadow-2xl" role="menu">
            <p className="px-3 pb-2 pt-1 text-xs text-zinc-500">Demo mode — view the platform as:</p>
            {roles.map((r) => (
              <button
                key={r.role}
                name="role"
                value={r.role}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left hover:bg-zinc-50"
                role="menuitem"
              >
                <span className="flex-1">
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-xs text-zinc-500">{r.who}</span>
                </span>
                {r.role === current && <Check className="h-4 w-4 text-brand" />}
              </button>
            ))}
            <input type="hidden" name="redirect" value={pathname} />
          </form>
        </>
      )}
    </div>
  );
}
