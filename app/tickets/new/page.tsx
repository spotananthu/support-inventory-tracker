import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import CreateTicketForm from "./CreateTicketForm";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/tickets");

  const [clients, engineers] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return <CreateTicketForm clients={clients} engineers={engineers} />;
}
