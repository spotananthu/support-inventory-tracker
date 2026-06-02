import { prisma } from "@/lib/db";
import { TicketStatus, Priority } from "@prisma/client";
import { isOverdue } from "@/services/ticketService";

export async function getDashboardStats() {
  const now = new Date();

  const [
    byStatus,
    byPriority,
    overdueCount,
    ticketsPerEngineer,
    recentTickets,
  ] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),

    prisma.ticket.groupBy({
      by: ["priority"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),

    prisma.ticket.count({
      where: {
        deletedAt: null,
        dueDate: { lt: now },
        status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
    }),

    prisma.ticket.groupBy({
      by: ["assignedTo"],
      where: {
        deletedAt: null,
        assignedTo: { not: null },
        status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
      },
      _count: { _all: true },
    }),

    prisma.ticket.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        client: { select: { id: true, name: true } },
        engineer: { select: { id: true, name: true } },
      },
    }),
  ]);

  const engineerIds = ticketsPerEngineer
    .map((t) => t.assignedTo)
    .filter(Boolean) as string[];

  const engineers = await prisma.user.findMany({
    where: { id: { in: engineerIds } },
    select: { id: true, name: true },
  });

  const engineerMap = Object.fromEntries(engineers.map((e) => [e.id, e.name]));

  const statusMap = Object.fromEntries(
    Object.values(TicketStatus).map((s) => [s, 0])
  );
  for (const row of byStatus) {
    statusMap[row.status] = row._count._all;
  }

  const priorityMap = Object.fromEntries(
    Object.values(Priority).map((p) => [p, 0])
  );
  for (const row of byPriority) {
    priorityMap[row.priority] = row._count._all;
  }

  return {
    byStatus: statusMap,
    byPriority: priorityMap,
    overdueCount,
    ticketsPerEngineer: ticketsPerEngineer.map((t) => ({
      engineerId: t.assignedTo,
      engineerName: engineerMap[t.assignedTo!] ?? "Unknown",
      openTickets: t._count._all,
    })),
    recentTickets: recentTickets.map((t) => ({
      ...t,
      isOverdue: isOverdue(t),
    })),
  };
}
