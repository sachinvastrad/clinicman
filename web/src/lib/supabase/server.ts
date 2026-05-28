import { getSession } from "@/lib/session";

export async function getSessionUser() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;

  return {
    id:         session.userId,
    clinic_id:  session.clinicId,
    full_name:  session.fullName,
    email:      session.email,
    role:       session.role,
    is_active:  true,
    avatar_url: null,
    phone:      "",
  };
}
