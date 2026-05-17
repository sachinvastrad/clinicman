# DrMan.ai — Roles & Permissions Matrix

**Version:** 1.0 | **Date:** 2026-05-16

---

## Role Definitions

| Role | Description |
|------|-------------|
| **admin** | Clinic owner / manager. Full access to all modules including financial data and staff management. |
| **doctor** | Homeopathic practitioner. Full clinical access; no access to financial reports or staff management. |
| **receptionist** | Front-desk staff. Manages appointments, billing, leads, and patient registration. No clinical write access. |

---

## Permission Matrix

`✅` = Full access (read + write + delete)  
`📖` = Read only  
`✏️` = Create + read + update (no delete)  
`➕` = Create only  
`❌` = No access

| Module / Action | Admin | Doctor | Receptionist |
|----------------|-------|--------|--------------|
| **Users & Staff** | | | |
| View staff list | ✅ | ❌ | ❌ |
| Create / deactivate staff | ✅ | ❌ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ |
| View audit log | ✅ | ❌ | ❌ |
| **Patients** | | | |
| Register new patient | ✅ | ✅ | ✅ |
| View patient profile | ✅ | ✅ | ✅ |
| Edit patient demographics | ✅ | ✅ | ✅ |
| Delete patient record | ✅ | ❌ | ❌ |
| Upload documents | ✅ | ✅ | ✅ |
| Delete documents | ✅ | ✅ | ❌ |
| **Clinical / Visits** | | | |
| Start a new visit | ✅ | ✅ | ❌ |
| Record case history | ✅ | ✅ | ❌ |
| Record vitals | ✅ | ✅ | ✅ |
| Write prescription | ✅ | ✅ | ❌ |
| View prescription | ✅ | ✅ | ✅ |
| Unlock / edit locked visit | ✅ | ❌ | ❌ |
| Miasmatic analysis | ✅ | ✅ | ❌ |
| **Diet & Yoga** | | | |
| Prescribe diet chart | ✅ | ✅ | ❌ |
| Prescribe yoga plan | ✅ | ✅ | ❌ |
| Manage diet templates | ✅ | ❌ | ❌ |
| Manage yoga library | ✅ | ❌ | ❌ |
| **Appointments** | | | |
| View calendar | ✅ | ✅ | ✅ |
| Book appointment (for patient) | ✅ | ✅ | ✅ |
| Reschedule / cancel | ✅ | ✅ | ✅ |
| Block slots / set holidays | ✅ | ✅ | ❌ |
| Confirm public bookings | ✅ | ❌ | ✅ |
| Manage queue / tokens | ✅ | ✅ | ✅ |
| **Inventory** | | | |
| View inventory | ✅ | 📖 | ✅ |
| Add / edit stock items | ✅ | ❌ | ✅ |
| Record stock-in | ✅ | ❌ | ✅ |
| Dispense medicines | ✅ | ❌ | ✅ |
| Delete inventory item | ✅ | ❌ | ❌ |
| **Billing & Invoices** | | | |
| Create invoice | ✅ | ❌ | ✅ |
| View invoices | ✅ | ❌ | ✅ |
| Record payment | ✅ | ❌ | ✅ |
| Apply discount | ✅ | ❌ | ✅ |
| Cancel invoice | ✅ | ❌ | ❌ |
| Generate medical certificate | ✅ | ✅ | ❌ |
| View outstanding dues | ✅ | ❌ | ✅ |
| **WhatsApp** | | | |
| Send appointment messages | ✅ | ❌ | ✅ |
| Send prescription via WA | ✅ | ✅ | ❌ |
| Send receipt via WA | ✅ | ❌ | ✅ |
| Send diet/yoga via WA | ✅ | ✅ | ❌ |
| View inbox (all conversations) | ✅ | ❌ | ✅ |
| Reply to patient messages | ✅ | ❌ | ✅ |
| Create broadcast campaign | ✅ | ❌ | ✅ |
| **Leads** | | | |
| View lead pipeline | ✅ | ❌ | ✅ |
| Create / update leads | ✅ | ❌ | ✅ |
| Convert lead to patient | ✅ | ❌ | ✅ |
| Delete lead | ✅ | ❌ | ❌ |
| **Follow-Ups** | | | |
| Set follow-up date | ✅ | ✅ | ❌ |
| View overdue follow-up list | ✅ | 📖 | ✅ |
| Send follow-up reminder | ✅ | ❌ | ✅ |
| **Finance** | | | |
| View income summary | ✅ | ❌ | ❌ |
| View daily cash book | ✅ | ❌ | ✅ |
| Submit expenses | ✅ | ❌ | ✅ |
| Approve / reject expenses | ✅ | ❌ | ❌ |
| View monthly P&L | ✅ | ❌ | ❌ |
| View GST report | ✅ | ❌ | ❌ |
| Export financial reports | ✅ | ❌ | ❌ |
| **Reports & Analytics** | | | |
| Patient analytics | ✅ | 📖 | ❌ |
| Appointment analytics | ✅ | 📖 | ❌ |
| Revenue analytics | ✅ | ❌ | ❌ |
| Lead funnel report | ✅ | ❌ | 📖 |
| Medicine dispensing report | ✅ | 📖 | ❌ |
| **Settings** | | | |
| Clinic profile & branding | ✅ | ❌ | ❌ |
| Booking widget configuration | ✅ | ❌ | ❌ |
| WhatsApp template management | ✅ | ❌ | ❌ |
| Notification preferences | ✅ | ✅ | ✅ |

---

## Implementation Guidelines

### Middleware (Next.js)

```typescript
// lib/permissions.ts

export const PERMISSIONS = {
  'patients:write':        ['admin', 'doctor', 'receptionist'],
  'patients:delete':       ['admin'],
  'clinical:write':        ['admin', 'doctor'],
  'billing:write':         ['admin', 'receptionist'],
  'finance:view':          ['admin'],
  'finance:daily_cash':    ['admin', 'receptionist'],
  'inventory:write':       ['admin', 'receptionist'],
  'leads:write':           ['admin', 'receptionist'],
  'staff:manage':          ['admin'],
  'whatsapp:inbox':        ['admin', 'receptionist'],
  'whatsapp:clinical_send':['admin', 'doctor'],
  'reports:view':          ['admin'],
  'settings:manage':       ['admin'],
} as const

export function hasPermission(
  role: 'admin' | 'doctor' | 'receptionist',
  permission: keyof typeof PERMISSIONS
): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}
```

### API Route Guard Pattern

```typescript
// In every protected API route handler:
import { getSessionUser } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/permissions'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: { code: 'UNAUTHORIZED', status: 401 } }, { status: 401 })
  if (!hasPermission(user.role, 'billing:write'))
    return Response.json({ error: { code: 'FORBIDDEN', status: 403 } }, { status: 403 })
  // ... handler logic
}
```

### Sidebar Navigation (Role-Aware)

```typescript
// Each nav item declares required permission
export const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',    icon: 'home',       permission: null },
  { label: 'Patients',     href: '/patients',     icon: 'users',      permission: null },
  { label: 'Appointments', href: '/appointments', icon: 'calendar',   permission: null },
  { label: 'Prescriptions',href: '/prescriptions',icon: 'pill',       permission: 'clinical:write' },
  { label: 'Billing',      href: '/billing',      icon: 'receipt',    permission: 'billing:write' },
  { label: 'Inventory',    href: '/inventory',    icon: 'package',    permission: 'inventory:write' },
  { label: 'Leads',        href: '/leads',        icon: 'funnel',     permission: 'leads:write' },
  { label: 'WhatsApp',     href: '/whatsapp',     icon: 'message',    permission: 'whatsapp:inbox' },
  { label: 'Finance',      href: '/finance',      icon: 'chart',      permission: 'finance:view' },
  { label: 'Reports',      href: '/reports',      icon: 'bar-chart',  permission: 'reports:view' },
  { label: 'Staff',        href: '/settings/staff',icon: 'shield',    permission: 'staff:manage' },
  { label: 'Settings',     href: '/settings',     icon: 'settings',   permission: 'settings:manage' },
]
```
