import { prisma } from "@/lib/db";
import type { CreateTicketInput, UpdateTicketInput, TicketFilters } from "@/lib/validations";
import { Priority, TicketStatus } from "@prisma/client";

const PRIORITY_ORDER: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export async function getTickets(filters: TicketFilters) {
  const { page, limit, search, status, priority, clientId, assignedTo, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = {
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
  };

  const orderBy =
    sortBy === "priority"
      ? { priority: sortOrder }
      : { [sortBy]: sortOrder };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        client: { select: { id: true, name: true } },
        engineer: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets: tickets.map((t) => ({
      ...t,
      isOverdue:
        t.dueDate !== null &&
        t.dueDate < new Date() &&
        t.status !== TicketStatus.RESOLVED &&
        t.status !== TicketStatus.CLOSED,
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
    isOverdue:
      ticket.dueDate !== null &&
      ticket.dueDate < new Date() &&
      ticket.status !== TicketStatus.RESOLVED &&
      ticket.status !== TicketStatus.CLOSED,
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
    existing._count.comments === 0
  ) {
    throw new Error(
      "A ticket cannot be marked as Resolved without at least one comment explaining the resolution"
    );
  }

  const trackedFields: (keyof UpdateTicketInput)[] = ["status", "priority", "assignedTo"];
  const auditEntries: { field: string; oldValue: string; newValue: string }[] = [];

  for (const field of trackedFields) {
    if (data[field] !== undefined && String(data[field]) !== String((existing as any)[field])) {
      auditEntries.push({
        field,
        oldValue: String((existing as any)[field] ?? "unassigned"),
        newValue: String(data[field]),
      });
    }
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
