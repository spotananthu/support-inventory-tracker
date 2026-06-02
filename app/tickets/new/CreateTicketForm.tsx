"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Client = { id: string; name: string };
type Engineer = { id: string; name: string };
type Props = { clients: Client[]; engineers: Engineer[] };

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const MODULES = ["ERP", "HEALTHCARE", "ECOMMERCE", "INTEGRATION", "OTHER"] as const;

const selectClass = "w-full h-9 rounded-md border border-input bg-background text-foreground px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50";

export default function CreateTicketForm({ clients, engineers }: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  const [form, setForm] = useState({
    title: "", description: "", priority: "MEDIUM",
    clientId: "", assignedTo: "", module: "OTHER", dueDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setWarning("");
    setErrors({});

    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title, description: form.description, priority: form.priority,
        clientId: form.clientId, module: form.module,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      }),
    });

    const json = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setErrors(json.details ?? { _form: json.error ?? "Something went wrong" });
      return;
    }

    if (json.warning) setWarning(json.warning);
    router.push(`/tickets/${json.data.id}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-foreground mt-2">New Ticket</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {errors._form && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
                  {errors._form}
                </div>
              )}
              {warning && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded text-sm text-orange-400 font-medium">
                  ⚠ {warning}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="title">Title <span className="text-red-400">*</span></Label>
                <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="Brief summary of the issue (min 5 characters)" disabled={submitting} />
                {errors.title && <p className="text-xs text-red-400">{errors.title}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description <span className="text-red-400">*</span></Label>
                <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe the issue in detail (min 20 characters)" rows={4} disabled={submitting} />
                {errors.description && <p className="text-xs text-red-400">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority <span className="text-red-400">*</span></Label>
                  <select id="priority" value={form.priority} onChange={(e) => set("priority", e.target.value)}
                    disabled={submitting} className={selectClass}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="module">Module <span className="text-red-400">*</span></Label>
                  <select id="module" value={form.module} onChange={(e) => set("module", e.target.value)}
                    disabled={submitting} className={selectClass}>
                    {MODULES.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientId">Client <span className="text-red-400">*</span></Label>
                <select id="clientId" value={form.clientId} onChange={(e) => set("clientId", e.target.value)}
                  disabled={submitting} className={selectClass}>
                  <option value="">Select a client...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.clientId && <p className="text-xs text-red-400">{errors.clientId}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assignedTo">Assign to Engineer</Label>
                <select id="assignedTo" value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}
                  disabled={submitting} className={selectClass}>
                  <option value="">Unassigned</option>
                  {engineers.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)} disabled={submitting} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {submitting ? "Creating..." : "Create Ticket"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
