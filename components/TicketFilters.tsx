"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  return (
    <div className={`flex flex-col sm:flex-row gap-3 flex-wrap ${isPending ? "opacity-60" : ""}`}>
      <Input
        placeholder="Search tickets..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          const timer = setTimeout(() => updateParam("search", val), 400);
          return () => clearTimeout(timer);
        }}
        className="sm:w-64"
      />

      <select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        value={searchParams.get("priority") ?? ""}
        onChange={(e) => updateParam("priority", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      <select
        value={searchParams.get("clientId") ?? ""}
        onChange={(e) => updateParam("clientId", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">All Clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <select
        value={searchParams.get("assignedTo") ?? ""}
        onChange={(e) => updateParam("assignedTo", e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        <option value="">All Engineers</option>
        {engineers.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      <select
        value={currentSort}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(":");
          const params = new URLSearchParams(searchParams.toString());
          params.set("sortBy", sortBy);
          params.set("sortOrder", sortOrder);
          params.delete("page");
          startTransition(() => router.push(`${pathname}?${params.toString()}`));
        }}
        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {searchParams.get("overdue") === "true" && (
        <div className="flex items-center h-9 px-3 rounded-md border border-red-300 bg-red-50 text-red-700 text-sm gap-2">
          <span>Overdue only</span>
          <button
            onClick={() => updateParam("overdue", "")}
            className="font-bold hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {Array.from(searchParams.keys()).filter(k => !["page","limit"].includes(k)).length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => router.push(pathname))}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
