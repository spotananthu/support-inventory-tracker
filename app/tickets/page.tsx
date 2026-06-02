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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <div className="flex gap-2">
            <ExportCsvButton />
            {isAdmin && (
              <Link href="/tickets/new">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 h-9 shadow-sm">
                  + New Ticket
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mb-4">
          <TicketFilters clients={clients} engineers={engineers} />
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Module</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Assigned To</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No tickets found.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {ticket.title.length > 55
                            ? ticket.title.slice(0, 55) + "…"
                            : ticket.title}
                        </Link>
                        {ticket.isOverdue && (
                          <span className="ml-2 text-xs text-red-600 font-medium">Overdue</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {(ticket.client as any)?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {ticket.module.charAt(0) + ticket.module.slice(1).toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {(ticket.engineer as any)?.name ?? (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ticket.dueDate ? (
                          <span className={ticket.isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                            {new Date(ticket.dueDate).toLocaleDateString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
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
