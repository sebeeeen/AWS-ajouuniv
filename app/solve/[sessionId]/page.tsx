import { notFound } from "next/navigation";

import { SolveWorkspace } from "@/components/solve/solve-workspace";
import { requireUser } from "@/lib/auth";
import { getSolveSession } from "@/lib/services/sessions";

export const dynamic = "force-dynamic";

export default async function SolvePage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const user = await requireUser();
  const session = await getSolveSession(sessionId, user.id);

  if (!session) {
    notFound();
  }

  return <SolveWorkspace session={session} />;
}
