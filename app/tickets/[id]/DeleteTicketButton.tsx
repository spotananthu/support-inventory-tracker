"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = { ticketId: string };

export default function DeleteTicketButton({ ticketId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  async function handleDelete() {
    const res = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Delete failed");
      setConfirming(false);
      return;
    }
    startTransition(() => router.push("/tickets"));
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Are you sure?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
          {isPending ? "Deleting..." : "Yes, delete"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={isPending}>
          Cancel
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <Button size="sm" variant="destructive" onClick={() => setConfirming(true)}>
      Delete Ticket
    </Button>
  );
}
