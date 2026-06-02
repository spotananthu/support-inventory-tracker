"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function Select({ value, onChange, children, className }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; className?: string }) {
  return (
    <div className="relative w-full sm:w-auto">
      <select value={value} onChange={onChange} className={className}>
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-muted-foreground">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    </div>
  );
}

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_ON_CLIENT", label: "Waiting on Client" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const PRIORITIES = [
  { value: "", label: "All Priorities" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "dueDate:asc", label: "Due date (soonest)" },
  { value: "dueDate:desc", label: "Due date (latest)" },
  { value: "priority:desc", label: "Priority (highest)" },
];

type Props = {
  clients: { id: string; name: string }[];
  engineers: { id: string; name: string }[];
};

export default function TicketFilters({ clients, engineers }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  const currentSort = `${searchParams.get("sortBy") ?? "createdAt"}:${searchParams.get("sortOrder") ?? "desc"}`;

  const selectClass = "h-9 w-full sm:w-auto rounded-md border border-input bg-background text-foreground px-3 pr-8 py-1 text-sm appearance-none cursor-pointer";

  return (
    <div className={`flex flex-col sm:flex-row gap-2 flex-wrap ${isPending ? "opacity-60" : ""}`}>
      <Input
        placeholder="Search tickets..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          const timer = setTimeout(() => updateParam("search", val), 400);
          return () => clearTimeout(timer);
        }}
        className="w-full sm:w-64"
      />

      <Select value={searchParams.get("status") ?? ""} onChange={(e) => updateParam("status", e.target.value)} className={selectClass}>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </Select>

      <Select value={searchParams.get("priority") ?? ""} onChange={(e) => updateParam("priority", e.target.value)} className={selectClass}>
        {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </Select>

      <Select value={searchParams.get("clientId") ?? ""} onChange={(e) => updateParam("clientId", e.target.value)} className={selectClass}>
        <option value="">All Clients</option>
        {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>

      <Select value={searchParams.get("assignedTo") ?? ""} onChange={(e) => updateParam("assignedTo", e.target.value)} className={selectClass}>
        <option value="">All Engineers</option>
        {engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </Select>

      <Select
        value={currentSort}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(":");
          const params = new URLSearchParams(searchParams.toString());
          params.set("sortBy", sortBy);
          params.set("sortOrder", sortOrder);
          params.delete("page");
          startTransition(() => router.push(`${pathname}?${params.toString()}`));
        }}
        className={selectClass}
      >
        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>

      {searchParams.get("overdue") === "true" && (
        <div className="flex items-center h-9 px-3 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 text-sm gap-2">
          <span>Overdue only</span>
          <button onClick={() => updateParam("overdue", "")} className="font-bold hover:text-red-300">×</button>
        </div>
      )}

      {Array.from(searchParams.keys()).filter(k => !["page","limit"].includes(k)).length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => startTransition(() => router.push(pathname))}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
