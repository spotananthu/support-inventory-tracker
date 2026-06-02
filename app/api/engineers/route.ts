import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, apiError } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const engineers = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ data: engineers });
  } catch (error) {
    return handleError(error);
  }
}
