import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}
