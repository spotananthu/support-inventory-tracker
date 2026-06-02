import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createTicketSchema, ticketFiltersSchema } from "@/lib/validations";
import { createTicket, getTickets } from "@/services/ticketService";
import { handleError, apiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filters = ticketFiltersSchema.parse(params);
    const result = await getTickets(filters);

    return NextResponse.json({ data: result.tickets, pagination: result.pagination });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const body = await req.json();
    const data = createTicketSchema.parse(body);
    const { ticket, warning } = await createTicket(data);

    return NextResponse.json(
      { data: ticket, ...(warning ? { warning } : {}) },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
