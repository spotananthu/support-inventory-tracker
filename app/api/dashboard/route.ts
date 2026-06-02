import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/services/dashboardService";
import { handleError, apiError } from "@/lib/errors";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const stats = await getDashboardStats();
    return NextResponse.json({ data: stats });
  } catch (error) {
    return handleError(error);
  }
}
