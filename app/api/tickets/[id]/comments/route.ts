import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCommentSchema } from "@/lib/validations";
import { addComment } from "@/services/commentService";
import { handleError, apiError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) return apiError("Unauthorised", 401);

    const { id } = await params;
    const body = await req.json();
    const data = createCommentSchema.parse({
      ...body,
      authorId: session.user.id,
    });

    const comment = await addComment(id, data);
    if (!comment) return apiError("Ticket not found", 404);

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
