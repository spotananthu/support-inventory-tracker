"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/Badges";

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"] as const;
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

type Engineer = { id: string; name: string };

type Props = {
  ticketId: string;
  currentStatus: string;
  currentPriority: string;
  currentAssignedTo: string;
  engineers: Engineer[];
  isAdmin: boolean;
};

export default function InlineTicketControls({
  ticketId,
  currentStatus,
  currentPriority,
  currentAssignedTo,
  engineers,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function update(field: string, value: string) {
    setError("");
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Update failed");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</span>
        <div className="flex items-center gap-2">
          <select
            defaultValue={currentStatus}
            onChange={(e) => update("status", e.target.value)}
            disabled={isPending}
            className="flex-1 h-8 rounded border border-input bg-background px-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").charAt(0) + s.replace(/_/g, " ").slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</span>
        <div className="flex items-center gap-2">
          <select
            defaultValue={currentPriority}
            onChange={(e) => update("priority", e.target.value)}
            disabled={isPending || !isAdmin}
            className="flex-1 h-8 rounded border border-input bg-background px-2 text-sm disabled:opacity-50"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <PriorityBadge priority={currentPriority} />
        </div>
      </div>

      {isAdmin && (
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assigned Engineer</span>
          <select
            defaultValue={currentAssignedTo}
            onChange={(e) => update("assignedTo", e.target.value)}
            disabled={isPending}
            className="w-full h-8 rounded border border-input bg-background px-2 text-sm"
          >
            <option value="">Unassigned</option>
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {isPending && <p className="text-xs text-gray-400">Saving...</p>}
    </div>
  );
}
