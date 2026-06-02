import { prisma } from "@/lib/db";

export async function getAuditLogs(ticketId: string) {
  return prisma.auditLog.findMany({
    where: { ticketId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAuditEntry(
  ticketId: string,
  userId: string,
  field: string,
  oldValue: string,
  newValue: string
) {
  return prisma.auditLog.create({
    data: { ticketId, userId, field, oldValue, newValue },
  });
}
