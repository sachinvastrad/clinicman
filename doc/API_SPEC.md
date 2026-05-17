# DrMan.ai — REST API Specification

**Base URL:** `/api`  
**Auth:** All protected routes require `Authorization: Bearer <supabase-jwt>` header.  
**Format:** JSON request/response unless noted. Dates in ISO 8601.

---

## Auth

### POST `/api/auth/send-otp`
Send OTP to phone number.
```json
// Request
{ "phone": "+919876543210" }

// Response 200
{ "message": "OTP sent" }
```

### POST `/api/auth/verify-otp`
Verify OTP and return session.
```json
// Request
{ "phone": "+919876543210", "otp": "123456" }

// Response 200
{
  "access_token": "...",
  "user": { "id": "uuid", "full_name": "...", "role": "doctor", "clinic_id": "uuid" }
}
```

---

## Users (Staff)

### GET `/api/users`
List all staff for the clinic. **Admin only.**
```json
// Response 200
{
  "data": [
    { "id": "uuid", "full_name": "Dr. Priya", "role": "doctor", "is_active": true }
  ]
}
```

### POST `/api/users`
Create a new staff account. **Admin only.**
```json
// Request
{ "full_name": "Reema Sharma", "phone": "+91...", "email": "...", "role": "receptionist" }

// Response 201
{ "id": "uuid", "patient_code": null, ... }
```

### PATCH `/api/users/:id`
Update staff profile or toggle active status. **Admin only.**

### DELETE `/api/users/:id`
Deactivate account (soft delete). **Admin only.**

---

## Patients

### GET `/api/patients`
Search/list patients.
```
Query params:
  q         - search string (name, phone, patient_code)
  limit     - default 20, max 100
  offset    - pagination
  case_type - chronic | acute | new
```
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "patient_code": "DRM-2026-00001",
      "full_name": "Priyanka More",
      "phone": "+91...",
      "date_of_birth": "1990-04-12",
      "gender": "female",
      "last_visit_date": "2026-05-10",
      "upcoming_appointment": "2026-05-20T10:00:00Z"
    }
  ],
  "total": 142
}
```

### POST `/api/patients`
Register a new patient.
```json
// Request
{
  "full_name": "Priyanka More",
  "date_of_birth": "1990-04-12",
  "gender": "female",
  "phone": "+919...",
  "address": "Pune, Maharashtra",
  "occupation": "Teacher",
  "whatsapp_optin": true,
  "case_type": "chronic"
}

// Response 201
{ "id": "uuid", "patient_code": "DRM-2026-00142" }
```

### GET `/api/patients/:id`
Full patient profile including case history, last 5 visits, upcoming appointment.

### PATCH `/api/patients/:id`
Update patient demographic details.

### GET `/api/patients/:id/visits`
All visits for a patient (paginated, newest first).

### GET `/api/patients/:id/documents`
All uploaded documents.

### POST `/api/patients/:id/documents`
Upload a document. **Multipart form-data.**
```
Fields: file (binary), doc_type, doc_date, notes, visit_id (optional)
Response 201: { "id": "uuid", "file_url": "..." }
```

---

## Visits

### POST `/api/visits`
Start a new visit.
```json
// Request
{
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "visit_type": "followup",
  "chief_complaint": "Headache worsening"
}

// Response 201
{ "id": "uuid", "status": "in_progress" }
```

### GET `/api/visits/:id`
Full visit details with vitals, prescription, diet chart, yoga plan.

### PATCH `/api/visits/:id`
Update visit notes, follow-up date, status.

### POST `/api/visits/:id/vitals`
Record vitals for a visit.
```json
// Request
{ "weight_kg": 65.5, "bp_systolic": 120, "bp_diastolic": 80, "pulse_bpm": 72 }
```

### GET `/api/patients/:id/case-history`
Get full case history.

### PUT `/api/patients/:id/case-history`
Update case history (full replace of editable sections).

---

## Appointments

### GET `/api/appointments`
```
Query params:
  date       - YYYY-MM-DD (required)
  doctor_id  - filter by doctor
  status     - confirmed | completed | cancelled
  source     - staff | website_widget
```
```json
// Response 200
{
  "data": [
    {
      "id": "uuid",
      "patient": { "id": "uuid", "full_name": "...", "patient_code": "..." },
      "appointment_date": "2026-05-20",
      "start_time": "10:00",
      "type": "followup",
      "status": "confirmed",
      "token_number": 3
    }
  ]
}
```

### POST `/api/appointments`
Book an appointment (staff).
```json
// Request
{
  "patient_id": "uuid",
  "doctor_id": "uuid",
  "appointment_date": "2026-05-20",
  "start_time": "10:00",
  "end_time": "10:15",
  "type": "followup",
  "reason": "Routine follow-up"
}

// Response 201
{ "id": "uuid", "status": "confirmed" }
// Side-effect: WhatsApp confirmation queued
```

### POST `/api/appointments/public`
Book from website widget (unauthenticated).
```json
// Request
{
  "full_name": "Priyanka More",
  "phone": "+91...",
  "complaint": "Skin allergy",
  "appointment_date": "2026-05-22",
  "start_time": "11:00"
}
// Response 201: { "id": "uuid", "status": "pending_confirmation" }
```

### PATCH `/api/appointments/:id`
Update status, reschedule, or cancel.
```json
// Reschedule
{ "action": "reschedule", "appointment_date": "2026-05-23", "start_time": "10:30" }

// Cancel
{ "action": "cancel", "cancel_reason": "Patient Request" }

// Check in
{ "action": "checkin" }

// Complete
{ "action": "complete" }
```

### GET `/api/appointments/slots`
Get available slots for a date.
```
Query: doctor_id, date
Response: { "slots": ["09:00","09:15","09:30",...] }
```

---

## Prescriptions

### GET `/api/visits/:visitId/prescription`
Get prescription for a visit.

### POST `/api/visits/:visitId/prescription`
Create prescription.
```json
// Request
{
  "dietary_notes": "Avoid coffee, raw onion",
  "followup_date": "2026-06-05",
  "items": [
    {
      "remedy_name": "Natrum Mur",
      "potency": "200CH",
      "form": "pills",
      "dose": "4 pills",
      "frequency": "OD",
      "duration": "15 days",
      "anupan": "Warm water",
      "is_intercurrent": false
    }
  ]
}

// Response 201
{ "id": "uuid" }
// Side-effect: PDF generation queued
```

### POST `/api/prescriptions/:id/send-whatsapp`
Send prescription PDF via WhatsApp.
```json
// Response 200
{ "message": "Sent", "wati_message_id": "..." }
```

### POST `/api/prescriptions/:id/generate-pdf`
(Re)generate PDF. Returns signed URL.
```json
// Response 200
{ "pdf_url": "https://..." }
```

---

## Inventory

### GET `/api/inventory`
```
Query: q (search), low_stock (boolean), expiring_days (int, e.g. 30)
```

### POST `/api/inventory`
Add new stock item.

### PATCH `/api/inventory/:id`
Update item details or quantity.

### POST `/api/inventory/stock-in`
Record a stock-in movement.
```json
{ "inventory_id": "uuid", "quantity": 50, "notes": "Purchase from supplier" }
```

### GET `/api/inventory/movements`
Stock movement log with filters.

---

## Billing

### GET `/api/invoices`
```
Query: patient_id, status (unpaid|partial|paid), date_from, date_to
```

### POST `/api/invoices`
Create invoice.
```json
{
  "patient_id": "uuid",
  "visit_id": "uuid",
  "items": [
    { "item_type": "consultation", "description": "Consultation Fee", "unit_price": 500 },
    { "item_type": "medicine", "description": "Natrum Mur 200CH", "quantity": 1,
      "unit_price": 80, "inventory_id": "uuid" }
  ],
  "discount_amount": 50,
  "payment_mode": "upi"
}
// Response 201: { "id": "uuid", "invoice_number": "DRM/2026-27/045", "total_amount": 530 }
```

### GET `/api/invoices/:id`
Full invoice with items and payment history.

### POST `/api/invoices/:id/payment`
Record payment against invoice.
```json
{ "amount": 530, "payment_mode": "cash", "reference_no": null }
```

### POST `/api/invoices/:id/send-whatsapp`
Send PDF receipt via WhatsApp.

### POST `/api/invoices/:id/generate-pdf`
Generate/regenerate invoice PDF.

### POST `/api/certificates`
Generate a medical certificate.
```json
{
  "patient_id": "uuid",
  "visit_id": "uuid",
  "template": "sick_leave",
  "notes": "Patient requires 3 days rest.",
  "from_date": "2026-05-16",
  "to_date": "2026-05-18"
}
// Response 201: { "pdf_url": "..." }
```

---

## WhatsApp

### GET `/api/whatsapp/inbox`
All patient conversations, sorted by latest message.
```
Query: q (patient name/phone), assigned_to
```

### GET `/api/whatsapp/conversations/:patientId`
Full message thread with a patient.

### POST `/api/whatsapp/send`
Send a template message.
```json
{
  "patient_id": "uuid",
  "template_name": "appointment_reminder",
  "params": { "name": "Priyanka", "date": "20 May", "time": "10:00 AM" }
}
```

### POST `/api/whatsapp/reply`
Send a free-text reply within a 24-hr session window.
```json
{ "patient_id": "uuid", "message": "Your appointment is confirmed." }
```

### POST `/api/whatsapp/webhook`
WATI webhook receiver (HMAC verified). Updates message delivery status.

### POST `/api/whatsapp/campaigns`
Create a broadcast campaign.
```json
{
  "name": "Monsoon Health Tips",
  "template_name": "health_tip",
  "filter": { "case_type": "chronic", "last_visit_before": "2026-02-01" },
  "scheduled_at": "2026-05-20T09:00:00Z"
}
```

---

## Leads

### GET `/api/leads`
```
Query: status, assigned_to, source, q
```

### POST `/api/leads`
Create a lead.

### PATCH `/api/leads/:id`
Update status, assign, add notes, set followup_date.

### POST `/api/leads/:id/convert`
Convert lead to patient.
```json
// Response 201
{ "patient_id": "uuid", "message": "Lead converted to patient" }
```

---

## Diet & Yoga

### GET `/api/diet-templates`
List all templates (global + clinic-specific).

### POST `/api/diet-templates`
Create a template. **Admin/Doctor.**

### PATCH `/api/diet-templates/:id`
Update template.

### GET `/api/yoga-asanas`
```
Query: q, condition_tag, difficulty, body_region
```

### GET `/api/yoga-asanas/:id`
Full asana detail.

### POST `/api/visits/:visitId/diet-chart`
Save diet chart for visit. Triggers PDF generation.

### POST `/api/visits/:visitId/yoga-plan`
Save yoga plan for visit. Triggers PDF generation.

### POST `/api/visits/:visitId/wellness-pdf`
Generate combined diet + yoga PDF and send via WhatsApp.

---

## Finance

### GET `/api/finance/income-summary`
```
Query: date_from, date_to, group_by (day|week|month)
Response: { "consultation": 15000, "medicine": 4200, "other": 800, "total": 20000 }
```

### GET `/api/finance/expenses`
```
Query: date_from, date_to, category, status
```

### POST `/api/finance/expenses`
Submit an expense entry.

### PATCH `/api/finance/expenses/:id`
Approve or reject an expense. **Admin only.**

### GET `/api/finance/pl-report`
```
Query: month (YYYY-MM)
Response: { revenue: {...}, expenses: {...}, gross_profit, net_profit }
```

### GET `/api/finance/outstanding`
List of invoices with balance_due > 0.

---

## Reports

### GET `/api/reports/patients`
Patient statistics (demographics, conditions, new vs returning).

### GET `/api/reports/appointments`
Appointment analytics (attended, no-show, busiest slots).

### GET `/api/reports/revenue`
Revenue trend data.

### GET `/api/reports/leads`
Lead funnel metrics.

---

## Settings

### GET `/api/settings`
Clinic settings including booking widget config.

### PATCH `/api/settings`
Update clinic settings. **Admin only.**

### GET `/api/settings/booking-widget-embed`
Returns embeddable HTML snippet.

---

## Error Responses

All errors follow:
```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "No patient found with the provided ID.",
    "status": 404
  }
}
```

| HTTP Status | When |
|-------------|------|
| 400 | Validation error (body includes `details` array) |
| 401 | Missing or invalid JWT |
| 403 | Insufficient role permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate phone, double-booking) |
| 422 | Business rule violation (e.g., slot unavailable) |
| 500 | Internal server error |
