import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getTicketById } from "@/services/ticketService";
import { prisma } from "@/lib/db";
import Navbar from "@/components/Navbar";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import InlineTicketControls from "./InlineTicketControls";
import AddCommentForm from "./AddCommentForm";
import DeleteTicketButton from "./DeleteTicketButton";
import Link from "next/link";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const [ticket, engineers] = await Promise.all([
    getTicketById(id),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!ticket) notFound();

  const isAdmin = session.user.role === "ADMIN";

  const client = ticket.client as { id: string; name: string; contactEmail: string } | null;
  const engineer = ticket.engineer as { id: string; name: string; email: string } | null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-4">
          <Link href="/tickets" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Tickets
          </Link>
        </div>

        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{ticket.title}</h1>
            <p className="text-xs text-gray-400 mt-1">ID: {ticket.id}</p>
          </div>
          <div className="flex gap-2 items-center flex-shrink-0">
            {ticket.isOverdue && (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                OVERDUE
              </span>
            )}
            {isAdmin && <DeleteTicketButton ticketId={ticket.id} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description */}
            <div className="bg-white rounded-lg border p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Description</h2>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg border p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Comments ({ticket.comments.length})
              </h2>

              {ticket.comments.length === 0 ? (
                <p className="text-sm text-gray-400 mb-4">No comments yet.</p>
              ) : (
                <div className="space-y-4 mb-6">
                  {ticket.comments.map((comment) => {
                    const author = comment.author as { id: string; name: string; role: string };
                    return (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {author.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{author.name}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {comment.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Add Comment</h3>
                <AddCommentForm ticketId={ticket.id} />
              </div>
            </div>

            {/* Audit Log */}
            {ticket.auditLogs.length > 0 && (
              <div className="bg-white rounded-lg border p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Change History</h2>
                <div className="space-y-2">
                  {ticket.auditLogs.map((log) => {
                    const user = log.user as { id: string; name: string };
                    return (
                      <div key={log.id} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-gray-400 w-32 flex-shrink-0">
                          {new Date(log.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        <span>
                          <span className="font-medium text-gray-800">{user.name}</span> changed{" "}
                          <span className="font-medium">{log.field}</span> from{" "}
                          <span className="bg-red-50 text-red-700 px-1 rounded">{log.oldValue}</span> to{" "}
                          <span className="bg-green-50 text-green-700 px-1 rounded">{log.newValue}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right — metadata */}
          <div className="space-y-4">

            {/* Status & Priority controls */}
            <div className="bg-white rounded-lg border p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Status & Priority</h2>
              <InlineTicketControls
                ticketId={ticket.id}
                currentStatus={ticket.status}
                currentPriority={ticket.priority}
                currentAssignedTo={ticket.assignedTo ?? ""}
                engineers={engineers}
                isAdmin={isAdmin}
              />
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg border p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Details</h2>

              <div>
                <p className="text-xs text-gray-500">Module</p>
                <p className="text-sm text-gray-800 capitalize">
                  {ticket.module.charAt(0) + ticket.module.slice(1).toLowerCase()}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Client</p>
                {client ? (
                  <div>
                    <p className="text-sm font-medium text-gray-800">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.contactEmail}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500">Assigned Engineer</p>
                {engineer ? (
                  <div>
                    <p className="text-sm font-medium text-gray-800">{engineer.name}</p>
                    <p className="text-xs text-gray-500">{engineer.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Unassigned</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500">Due Date</p>
                {ticket.dueDate ? (
                  <p className={`text-sm font-medium ${ticket.isOverdue ? "text-red-600" : "text-gray-800"}`}>
                    {new Date(ticket.dueDate).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                    {ticket.isOverdue && " (Overdue)"}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">No due date</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-800">
                  {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-800">
                  {new Date(ticket.updatedAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
