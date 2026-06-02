import { prisma } from "@/lib/db";

export async function getAuditLogs(ticketId: string) {
  return prisma.auditLog.findMany({
    where: { ticketId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
