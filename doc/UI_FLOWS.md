# DrMan.ai — UI Flows & Screen Map

**Version:** 1.0 | **Date:** 2026-05-16

---

## 1. Authentication Flow

```
/login
  └── Enter phone number
        └── Receive OTP (SMS)
              └── Enter OTP
                    ├── VALID → redirect to role-specific /dashboard
                    └── INVALID → "Incorrect OTP" error (retry)
```

---

## 2. Receptionist Flow — Patient Walk-In (Full Journey)

```
Receptionist Dashboard
  │
  ├── [New Patient?]
  │     └── /patients/new
  │           ├── Fill registration form (name, DOB, phone, WhatsApp opt-in)
  │           └── Save → Patient created (ID: DRM-2026-XXXXX)
  │
  └── [Returning Patient?]
        └── Global search bar → type name/phone
              └── Select patient → /patients/:id (Patient Profile)
                    ├── Quick actions: Book Appointment | New Invoice | Send WhatsApp
                    └── [Book Appointment]
                          └── /appointments/new?patientId=:id
                                ├── Select date on calendar
                                ├── Select available time slot
                                ├── Select appointment type (New / Follow-up / Emergency)
                                ├── Enter reason (optional)
                                └── Save → Appointment confirmed
                                      └── WhatsApp confirmation auto-sent ✓
```

---

## 3. Patient Arrival & Queue

```
Patient arrives at clinic
  │
Receptionist → /appointments (today's list)
  └── Find appointment → Click "Check In"
        └── Token assigned (e.g., Token #5)
              └── Queue board updates (/queue — TV screen)
                    ├── Status: Waiting → With Doctor → Done
                    └── "You're Next" WhatsApp sent when previous patient done
```

---

## 4. Doctor Flow — Consultation

```
Doctor Dashboard → Today's Appointments
  └── Click patient → /patients/:id/visits/new
        │
        ├── [TAB 1: Case Notes]
        │     ├── Chief Complaint
        │     ├── Changes since last visit
        │     ├── Mental / Physical generals
        │     └── Auto-save every 60s
        │
        ├── [TAB 2: Vitals]
        │     └── Weight, BP, Pulse, Temperature → Save
        │
        ├── [TAB 3: Prescription]
        │     ├── Add remedy line (name, potency, dose, frequency, duration)
        │     ├── Add dietary notes
        │     ├── Set follow-up date
        │     └── Preview PDF → Save Prescription
        │           └── "Send via WhatsApp" → PDF sent to patient ✓
        │
        ├── [TAB 4: Diet Chart]  (optional)
        │     ├── Select condition template
        │     ├── Customise rows
        │     └── Save → bundled into Wellness PDF
        │
        ├── [TAB 5: Yoga Plan]  (optional)
        │     ├── Search / filter asanas
        │     ├── Add asanas with duration/reps
        │     └── Save → bundled into Wellness PDF
        │
        └── Mark Visit Complete
              └── Receptionist notified to call next patient
```

---

## 5. Receptionist Flow — Billing

```
After doctor completes visit:

Receptionist → /patients/:id OR /billing/new
  └── Invoice auto-populated:
        ├── Line 1: Consultation Fee
        └── Line 2+: Medicines dispensed (from prescription)
              │
              ├── Add manual line items (if needed)
              ├── Apply discount (optional)
              ├── Select payment mode (Cash / UPI / Card)
              └── Save Invoice
                    ├── Print receipt (thermal printer)
                    └── Send Receipt via WhatsApp ✓
```

---

## 6. Online Booking (Patient Self-Service via Website)

```
Patient visits clinic website
  └── Clicks "Book Appointment" → opens booking widget (/book embed)
        ├── Enter name, phone, complaint
        ├── Select date
        ├── Select available time slot
        └── Confirm
              └── /api/appointments/public → status: pending_confirmation
                    └── Receptionist gets in-app notification
                          └── Receptionist reviews → Confirms or Suggests alternate
                                └── Patient receives WhatsApp confirmation ✓
```

---

## 7. Lead Management Flow

```
New Enquiry arrives (WhatsApp / Website form / Walk-in)
  │
  └── Receptionist → /leads → "New Lead"
        ├── Enter: name, phone, complaint, source
        └── Save → Lead appears in Kanban (column: New)
              │
              ├── Receptionist moves card: New → Contacted
              │     └── Add note (called on X date, interested in Y)
              ├── Move: Contacted → Appointment Booked
              │     └── Book appointment inline
              └── Move: Appointment Booked → Converted
                    └── "Convert to Patient" → Registration form pre-filled
                          └── Patient record created ✓
```

---

## 8. Admin Flow — Financial Overview

```
Admin Dashboard
  ├── KPI tiles: Today's Collections, New Patients, Appointments, Leads
  ├── Alerts: Low Stock | Overdue Follow-ups | Pending Expenses
  │
  └── /finance
        ├── [Daily Cash Book] → income and expense entries for selected date
        ├── [Expenses]
        │     ├── View submitted expenses
        │     ├── Approve / Reject with one click
        │     └── Submit new expense
        ├── [Monthly P&L]
        │     ├── Revenue breakdown by type
        │     ├── Expense breakdown by category
        │     ├── Net Profit chart (3-month trend)
        │     └── Export PDF / Excel
        └── [Outstanding Dues]
              └── List patients with balance → "Send Reminder" button
```

---

## 9. WhatsApp Inbox Flow

```
Receptionist → /whatsapp
  ├── Inbox: list of patient conversations (latest message, unread badge)
  ├── Search by name / phone
  ├── Click conversation → full thread (left: list, right: messages)
  │     ├── Reply (text) — only within 24-hr window
  │     ├── Send template (outside window)
  │     └── Assign conversation to another staff member
  └── New Conversation → search patient → select template → send
```

---

## 10. Screen Inventory

### Public Screens (no auth)
| Route | Screen |
|-------|--------|
| `/login` | OTP login |
| `/book` | Booking widget (embeddable) |

### Shared (all roles)
| Route | Screen |
|-------|--------|
| `/dashboard` | Role-specific home dashboard |
| `/patients` | Patient list & search |
| `/patients/new` | Register new patient |
| `/patients/:id` | Patient profile |
| `/patients/:id/visits/:visitId` | Visit detail |
| `/appointments` | Calendar / daily list |
| `/profile` | Own profile & notification settings |

### Receptionist + Admin
| Route | Screen |
|-------|--------|
| `/appointments/new` | Book appointment |
| `/billing` | Invoice list |
| `/billing/new` | Create invoice |
| `/billing/:id` | Invoice detail + payment |
| `/inventory` | Medicine stock list |
| `/leads` | Lead Kanban |
| `/whatsapp` | Message inbox |
| `/whatsapp/campaigns` | Broadcast campaigns |

### Doctor + Admin
| Route | Screen |
|-------|--------|
| `/patients/:id/visits/new` | New visit / consultation |
| `/prescriptions` | My prescriptions list |
| `/content/yoga` | Yoga library (prescribe) |
| `/content/diet` | Diet templates |

### Admin Only
| Route | Screen |
|-------|--------|
| `/finance` | Financial overview |
| `/finance/pl` | Monthly P&L |
| `/finance/expenses` | Expense management |
| `/reports` | Analytics dashboard |
| `/settings` | Clinic settings |
| `/settings/staff` | Staff management |
| `/settings/widget` | Booking widget config + embed |
| `/settings/whatsapp` | Template management |
| `/audit-log` | System audit log |

---

## 11. Component Naming Conventions

```
PatientCard          — compact patient info card (used in search results, lists)
PatientProfileHeader — top section of patient profile (photo, name, ID, quick actions)
VisitTimeline        — vertical timeline of all visits for a patient
PrescriptionForm     — remedy line items form with add/remove
PrescriptionPDF      — React-PDF component for prescription template
InvoiceBuilder       — line-item invoice builder with totals
QueueBoard           — real-time token queue display
AppointmentCalendar  — date/time slot picker (uses react-big-calendar or custom)
WhatsAppInbox        — conversation list + thread view
LeadKanban           — drag-and-drop pipeline board
DietChartBuilder     — table editor for diet templates
YogaAsanaCard        — asana card with image and detail drawer
KPITile              — dashboard metric tile with sparkline
```
