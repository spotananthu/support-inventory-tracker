"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ExportCsvButton() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/export?${searchParams.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("CSV export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center justify-center h-9 px-4 text-sm font-semibold border border-border rounded-md bg-card text-foreground hover:bg-muted transition-colors disabled:opacity-50 shadow-sm"
    >
      {loading ? "Exporting..." : "Export CSV"}
    </button>
  );
}
