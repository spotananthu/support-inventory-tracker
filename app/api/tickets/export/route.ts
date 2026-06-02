import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ticketFiltersSchema } from "@/lib/validations";
import { getTickets } from "@/services/ticketService";
import { apiError, handleError } from "@/lib/errors";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = ticketFiltersSchema.parse({ ...params, limit: 100, page: 1 });
    type TicketRow = Awaited<ReturnType<typeof getTickets>>["tickets"][number];
    let allTickets: TicketRow[] = [];
    let page = 1;

    while (true) {
      const { tickets, pagination } = await getTickets({ ...filters, page, limit: 100 });
      allTickets = allTickets.concat(tickets);
      if (page >= pagination.totalPages) break;
      page++;
    }

    const headers = ["ID", "Title", "Status", "Priority", "Module", "Client", "Assigned To", "Due Date", "Created At", "Overdue"];
    const rows = allTickets.map((t: TicketRow) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.module,
      `"${(t.client as { name?: string })?.name ?? ""}"`,
      `"${(t.engineer as { name?: string })?.name ?? "Unassigned"}"`,
      t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "",
      new Date(t.createdAt).toISOString().split("T")[0],
      t.isOverdue ? "Yes" : "No",
    ]);

    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tickets-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
