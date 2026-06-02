"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = { ticketId: string };

export default function AddCommentForm({ ticketId }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to add comment");
      return;
    }

    setMessage("");
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setError("");
        }}
        placeholder="Add a comment or update..."
        rows={3}
        disabled={isPending}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <Button type="submit" size="sm" disabled={isPending || !message.trim()}>
        {isPending ? "Posting..." : "Post Comment"}
      </Button>
    </form>
  );
}
