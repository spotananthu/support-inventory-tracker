import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTickets } from "@/services/ticketService";
import { prisma } from "@/lib/db";
import { ticketFiltersSchema } from "@/lib/validations";
import Navbar from "@/components/Navbar";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import TicketFilters from "@/components/TicketFilters";
import Pagination from "@/components/Pagination";
import ExportCsvButton from "@/components/ExportCsvButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "string") flat[k] = v;
  }
  const filters = ticketFiltersSchema.parse(flat);

  const [{ tickets, pagination }, clients, engineers] = await Promise.all([
    getTickets(filters),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-200 to-blue-400 bg-clip-text text-transparent">Tickets</h1>
          <div className="flex gap-2">
            <ExportCsvButton />
            {isAdmin && (
              <Link href="/tickets/new">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-4 h-9 shadow-sm">
                  + New Ticket
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mb-4">
          <TicketFilters clients={clients} engineers={engineers} />
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Module</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned To</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {ticket.title.length > 55 ? ticket.title.slice(0, 55) + "…" : ticket.title}
                        </Link>
                        {ticket.isOverdue && (
                          <span className="ml-2 text-xs text-red-400 font-medium">Overdue</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(ticket.client as any)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {ticket.module.charAt(0) + ticket.module.slice(1).toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(ticket.engineer as any)?.name ?? (
                          <span className="text-muted-foreground/50 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ticket.dueDate ? (
                          <span className={ticket.isOverdue ? "text-red-400 font-medium" : "text-muted-foreground"}>
                            {new Date(ticket.dueDate).toLocaleDateString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
          />
        </div>
      </main>
    </div>
  );
}
