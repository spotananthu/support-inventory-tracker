import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, apiError } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const clients = await prisma.client.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, contactEmail: true, status: true },
    });

    return NextResponse.json({ data: clients });
  } catch (error) {
    return handleError(error);
  }
}
