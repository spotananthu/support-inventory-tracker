import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/services/dashboardService";
import Navbar from "@/components/Navbar";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const stats = await getDashboardStats();

  const statCards = [
    { label: "Open", value: stats.byStatus.OPEN, color: "text-blue-600" },
    { label: "In Progress", value: stats.byStatus.IN_PROGRESS, color: "text-yellow-600" },
    { label: "Overdue", value: stats.overdueCount, color: "text-red-600" },
    { label: "Critical", value: stats.byPriority.CRITICAL, color: "text-red-700" },
    { label: "Resolved", value: stats.byStatus.RESOLVED, color: "text-green-600" },
    { label: "Closed", value: stats.byStatus.CLOSED, color: "text-gray-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tickets per Engineer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open Tickets per Engineer</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.ticketsPerEngineer.length === 0 ? (
                <p className="text-sm text-gray-500">No assigned tickets</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-gray-600">Engineer</th>
                      <th className="pb-2 font-medium text-gray-600 text-right">Open Tickets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ticketsPerEngineer.map((row: { engineerId: string | null; engineerName: string; openTickets: number }) => (
                      <tr key={row.engineerId} className="border-b last:border-0">
                        <td className="py-2 text-gray-900">{row.engineerName}</td>
                        <td className="py-2 text-right font-medium">{row.openTickets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* By Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tickets by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-gray-600">Priority</th>
                    <th className="pb-2 font-medium text-gray-600 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                    <tr key={p} className="border-b last:border-0">
                      <td className="py-2">
                        <PriorityBadge priority={p} />
                      </td>
                      <td className="py-2 text-right font-medium">{stats.byPriority[p]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Tickets</CardTitle>
            <Link href="/tickets" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-gray-600">Title</th>
                    <th className="pb-2 font-medium text-gray-600">Client</th>
                    <th className="pb-2 font-medium text-gray-600">Status</th>
                    <th className="pb-2 font-medium text-gray-600">Priority</th>
                    <th className="pb-2 font-medium text-gray-600">Due</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTickets.map((ticket: { id: string; title: string; status: string; priority: string; dueDate: Date | null; isOverdue: boolean; client: unknown; engineer: unknown }) => (
                    <tr key={ticket.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {ticket.title.length > 50
                            ? ticket.title.slice(0, 50) + "…"
                            : ticket.title}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {(ticket.client as any)?.name}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-2 pr-4">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="py-2">
                        {ticket.dueDate ? (
                          <span className={ticket.isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                            {new Date(ticket.dueDate).toLocaleDateString("en-IN")}
                            {ticket.isOverdue && " (Overdue)"}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
