import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ticketFiltersSchema } from "@/lib/validations";
import { getTickets } from "@/services/ticketService";
import { apiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return apiError("Unauthorised", 401);

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const filters = ticketFiltersSchema.parse({ ...params, limit: 1000, page: 1 });
  const { tickets } = await getTickets(filters);

  const headers = ["ID", "Title", "Status", "Priority", "Module", "Client", "Assigned To", "Due Date", "Created At", "Overdue"];
  const rows = tickets.map((t) => [
    t.id,
    `"${t.title.replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.module,
    `"${(t.client as any)?.name ?? ""}"`,
    `"${(t.engineer as any)?.name ?? "Unassigned"}"`,
    t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "",
    new Date(t.createdAt).toISOString().split("T")[0],
    t.isOverdue ? "Yes" : "No",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="tickets-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
