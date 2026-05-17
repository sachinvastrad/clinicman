import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import { Sidebar } from "@/components/shared/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const authUser = {
    id:        user.id,
    clinicId:  user.clinic_id,
    fullName:  user.full_name,
    phone:     user.phone,
    email:     user.email,
    role:      user.role as "admin" | "doctor" | "receptionist",
    isActive:  user.is_active,
    avatarUrl: user.avatar_url,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={authUser} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
