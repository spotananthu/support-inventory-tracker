import { prisma } from "@/lib/db";
import type { CreateTicketInput, UpdateTicketInput, TicketFilters } from "@/lib/validations";
import { Priority, TicketStatus, Prisma } from "@prisma/client";

const PRIORITY_ORDER: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function canResolve(commentCount: number): boolean {
  return commentCount > 0;
}

export async function getTickets(filters: TicketFilters) {
  const { page, limit, search, status, priority, clientId, assignedTo, overdue, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = {
    deletedAt: null,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(clientId && { clientId }),
    ...(assignedTo && { assignedTo }),
    ...(overdue && {
      dueDate: { lt: new Date() },
      status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
    }),
  };

  const orderBy =
    sortBy === "priority"
      ? [
          { priority: sortOrder },
        ]
      : [{ [sortBy]: sortOrder }];

  const prioritySortOrder = sortOrder === "desc"
    ? [Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW]
    : [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.CRITICAL];

  const [allTickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: sortBy !== "priority" ? orderBy : undefined,
      include: {
        client: { select: { id: true, name: true } },
        engineer: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  const tickets = sortBy === "priority"
    ? [...allTickets].sort((a, b) =>
        prioritySortOrder.indexOf(a.priority) - prioritySortOrder.indexOf(b.priority)
      )
    : allTickets;

  return {
    tickets: tickets.map((t) => ({
      ...t,
      isOverdue: isOverdue(t),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTicketById(id: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: true,
      engineer: { select: { id: true, name: true, email: true, role: true } },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      auditLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) return null;

  return {
    ...ticket,
    isOverdue: isOverdue(ticket),
  };
}

export async function createTicket(data: CreateTicketInput) {
  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority as Priority,
      clientId: data.clientId,
      assignedTo: data.assignedTo ?? null,
      module: data.module as any,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      client: { select: { id: true, name: true } },
      engineer: { select: { id: true, name: true } },
    },
  });

  const warning =
    ticket.priority === Priority.CRITICAL
      ? "This ticket requires immediate attention"
      : undefined;

  return { ticket, warning };
}

export async function updateTicket(
  id: string,
  data: UpdateTicketInput,
  userId: string
) {
  const existing = await prisma.ticket.findFirst({
    where: { id, deletedAt: null },
    include: { _count: { select: { comments: true } } },
  });

  if (!existing) return null;

  if (
    data.status === TicketStatus.RESOLVED &&
    !canResolve(existing._count.comments)
  ) {
    throw new Error(
      "A ticket cannot be marked as Resolved without at least one comment explaining the resolution"
    );
  }

  const trackedFields: (keyof UpdateTicketInput)[] = ["status", "priority", "assignedTo"];
  const auditEntries: { field: string; oldValue: string; newValue: string }[] = [];

  // Resolve engineer IDs to names for readable audit log entries
  const engineerIds = new Set<string>();
  if (existing.assignedTo) engineerIds.add(existing.assignedTo);
  if (data.assignedTo) engineerIds.add(data.assignedTo);

  const engineers = engineerIds.size > 0
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(engineerIds) } },
        select: { id: true, name: true },
      })
    : [];
  const engineerMap = Object.fromEntries(engineers.map((e) => [e.id, e.name]));

  for (const field of trackedFields) {
    if (data[field] === undefined) continue;
    const rawOld = (existing as any)[field];
    const rawNew = data[field];
    if (String(rawNew ?? "") === String(rawOld ?? "")) continue;

    let oldValue: string;
    let newValue: string;

    if (field === "assignedTo") {
      oldValue = rawOld ? (engineerMap[rawOld] ?? rawOld) : "Unassigned";
      newValue = rawNew ? (engineerMap[rawNew as string] ?? rawNew as string) : "Unassigned";
    } else {
      oldValue = rawOld ?? "—";
      newValue = String(rawNew);
    }

    auditEntries.push({ field, oldValue, newValue });
  }

  const [ticket] = await prisma.$transaction([
    prisma.ticket.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.priority && { priority: data.priority as Priority }),
        ...(data.status && { status: data.status as TicketStatus }),
        ...(data.module && { module: data.module as any }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
      },
      include: {
        client: { select: { id: true, name: true } },
        engineer: { select: { id: true, name: true } },
      },
    }),
    ...auditEntries.map((entry) =>
      prisma.auditLog.create({
        data: { ticketId: id, userId, ...entry },
      })
    ),
  ]);

  return ticket;
}

export async function deleteTicket(id: string) {
  const existing = await prisma.ticket.findFirst({
    where: { id, deletedAt: null },
  });

  if (!existing) return null;

  return prisma.ticket.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export function isOverdue(ticket: { dueDate: Date | null; status: TicketStatus }) {
  return (
    ticket.dueDate !== null &&
    ticket.dueDate < new Date() &&
    ticket.status !== TicketStatus.RESOLVED &&
    ticket.status !== TicketStatus.CLOSED
  );
}
