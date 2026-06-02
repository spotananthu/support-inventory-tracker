import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTicketSchema } from "@/lib/validations";
import { getTicketById, updateTicket, deleteTicket } from "@/services/ticketService";
import { handleError, apiError } from "@/lib/errors";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const { id } = await params;
    const ticket = await getTicketById(id);
    if (!ticket) return apiError("Ticket not found", 404);

    return NextResponse.json({ data: ticket });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const { id } = await params;
    const body = await req.json();
    const data = updateTicketSchema.parse(body);

    const ticket = await updateTicket(id, data, session.user.id);
    if (!ticket) return apiError("Ticket not found", 404);

    return NextResponse.json({ data: ticket });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Resolved")) {
      return apiError(error.message, 400);
    }
    return handleError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);
    if (session.user.role !== "ADMIN") return apiError("Forbidden", 403);

    const { id } = await params;
    const ticket = await deleteTicket(id);
    if (!ticket) return apiError("Ticket not found", 404);

    return NextResponse.json({ data: { message: "Ticket deleted" } });
  } catch (error) {
    return handleError(error);
  }
}
