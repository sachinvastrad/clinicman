import { Header } from "@/components/shared/header";
import { getSessionUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/leads/kanban-board";

const COLUMNS = ["new", "contacted", "interested", "not_interested", "converted", "lost"] as const;

export default async function LeadsKanbanPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const leads = await prisma.lead.findMany({
    where: { clinicId: user.clinic_id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, fullName: true, phone: true, source: true,
      status: true, interestedIn: true, followUpDate: true, createdAt: true,
    },
  });

  const grouped = Object.fromEntries(
    COLUMNS.map((col) => [col, leads.filter((l) => l.status === col)])
  ) as Record<string, typeof leads>;

  return (
    <>
      <Header title="Lead Kanban" />
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard initialGrouped={grouped} />
      </div>
    </>
  );
}
