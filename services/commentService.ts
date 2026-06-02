import { prisma } from "@/lib/db";
import type { CreateCommentInput } from "@/lib/validations";

export async function addComment(ticketId: string, data: CreateCommentInput) {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, deletedAt: null },
  });

  if (!ticket) return null;

  return prisma.comment.create({
    data: {
      ticketId,
      authorId: data.authorId,
      message: data.message,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });
}
