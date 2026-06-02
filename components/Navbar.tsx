"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = [
    { href: "/", label: "Dashboard" },
    { href: "/tickets", label: "Tickets" },
  ];

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50" style={{ boxShadow: "0 1px 0 oklch(1 0 0 / 6%), 0 4px 16px oklch(0 0 0 / 30%)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-8">
            <span className="font-bold tracking-tight bg-gradient-to-r from-gray-200 to-blue-400 bg-clip-text text-transparent">
              Support Tracker
            </span>
            <div className="flex gap-1 border border-border rounded-lg p-1 bg-muted/40">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-150 ${
                    pathname === link.href
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {session?.user && (
              <span className="text-sm text-muted-foreground">
                {session.user.name}{" "}
                <span className="text-xs opacity-50">({session.user.role})</span>
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
