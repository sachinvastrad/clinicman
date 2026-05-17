# DrMan.ai — EPICs & User Stories
**Date:** 2026-05-16 | **Version:** 2.0 (merged from original research + ChatGPT PRD)

---

## EPIC Overview

| ID | Epic Name | Phase | SP |
|----|-----------|-------|----|
| E-01 | User Management & Access Control | MVP | 13 |
| E-02 | Patient Registration & EMR | MVP | 37 |
| E-03 | Appointment & Queue Management | MVP | 19 |
| E-04 | Homeopathic Clinical & Prescription Module | MVP + v1.2 | 44 |
| E-05 | In-House Medicine Dispensing & Vendor Mgmt | MVP | 18 |
| E-06 | Billing, Receipts & Payments | MVP | 21 |
| E-07 | WhatsApp Communication Hub | MVP + v1.1 | 30 |
| E-08 | Lead Management CRM | v1.1 | 16 |
| E-09 | Diet Chart & Yoga Library | v1.1 | 16 |
| E-10 | Follow-Up & Escalation Engine | v1.1 | 8 |
| E-11 | Financial Management & Reports | v1.1 | 19 |
| E-12 | Analytics & Admin Dashboard | v1.2 | 18 |
| E-13 | Online Booking Widget (Public) | v1.1 | 11 |
| E-14 | Push Notifications | v1.1 | 5 |
| E-15 | AI Features (Phase 3) | v3.0 | 40 |
| **TOTAL** | | | **315** |

> **SP = Story Points** — 1 SP ≈ 1 day for a mid-level full-stack developer.  
> MVP (E-01 to E-06 + core E-07 + E-10 base) ≈ 130 SP ≈ 13 weeks for a 2-dev team.

---

## E-01 · User Management & Access Control

**Goal:** Ensure each staff member has appropriate, audited, role-scoped access to the system.

---

### US-01-01 · Staff Account Creation
**As an** Admin,  
**I want to** create a new staff account by entering name, phone, role, and email,  
**so that** the new employee can log in on day one with the correct permissions.

**Acceptance Criteria:**
- [ ] Form fields: Full Name, Phone, Email, Role (Doctor / Receptionist)
- [ ] System sends OTP to the new staff member's phone to activate the account
- [ ] New account listed in Staff Management with status Active
- [ ] Role permissions applied immediately on first login
- [ ] Admin receives in-app confirmation

**SP:** 3 | **Priority:** P0

---

### US-01-02 · Role-Based Navigation
**As a** staff member,  
**I want to** see only the menu items and screens relevant to my role,  
**so that** I am not confused by features I cannot use.

**Acceptance Criteria:**
- [ ] Doctor: Dashboard, My Patients, Appointments, Prescriptions, Yoga/Diet Library
- [ ] Receptionist: Dashboard, Patients, Appointments, Billing, Leads, WhatsApp, Inventory
- [ ] Admin: all of the above + Finance, Reports, Staff Management, Settings
- [ ] Navigating to an unauthorised URL returns a 403 page

**SP:** 3 | **Priority:** P0

---

### US-01-03 · OTP Login
**As a** staff member,  
**I want to** log in with my phone number and a one-time password,  
**so that** I don't need to remember a complex password.

**Acceptance Criteria:**
- [ ] Login screen accepts phone number
- [ ] 6-digit OTP sent via SMS within 10 seconds
- [ ] OTP valid for 5 minutes; expired OTP shows clear error
- [ ] 5 failed attempts locks account for 15 minutes
- [ ] Successful login redirects to role-specific dashboard

**SP:** 2 | **Priority:** P0

---

### US-01-04 · Deactivate Staff Account
**As an** Admin,  
**I want to** deactivate a staff member's account when they leave,  
**so that** they can no longer access patient data.

**Acceptance Criteria:**
- [ ] Admin toggles Active/Inactive from Staff Management
- [ ] Deactivated user is immediately logged out; cannot log back in
- [ ] Historical records created by that user remain intact and attributed
- [ ] Admin sees confirmation prompt before deactivating

**SP:** 2 | **Priority:** P1

---

### US-01-05 · Immutable Audit Log
**As an** Admin,  
**I want to** view a log of all sensitive actions (record access, edits, deletions),  
**so that** I can investigate any data misuse or compliance issue.

**Acceptance Criteria:**
- [ ] Captures: timestamp, user ID, action type, affected entity, old + new values
- [ ] Log is read-only — no user role can delete entries
- [ ] Filter by user, date range, action type
- [ ] Export to CSV

**SP:** 3 | **Priority:** P1

---

## E-02 · Patient Registration & EMR

**Goal:** Capture and maintain a complete, searchable, homeopathy-specific patient record across all visits.

---

### US-02-01 · New Patient Registration
**As a** Receptionist,  
**I want to** register a new patient with demographic and contact details,  
**so that** a permanent medical record is created before the first consultation.

**Acceptance Criteria:**
- [ ] Fields: Full Name*, DOB*, Gender*, Phone* (unique), Email, Address, Occupation, Allergies, Referred By
- [ ] System generates unique Patient ID (DRM-YYYY-NNNNN)
- [ ] Optional: photo upload
- [ ] Duplicate detection by phone number — warns and shows existing record
- [ ] WhatsApp opt-in checkbox with consent text displayed
- [ ] Patient searchable immediately after saving

**SP:** 5 | **Priority:** P0

---

### US-02-02 · Constitutional Profile & Homeopathic Background
**As a** Doctor,  
**I want to** record a patient's constitutional profile during case-taking,  
**so that** the patient's long-term remedy selection is grounded in their core constitution.

**Acceptance Criteria:**
- [ ] Fields: Constitution type (Calcarea / Sulphur / Lycopodium / Silica / Phosphorus / Pulsatilla / Nux Vomica / Other), characteristic symptoms (free text), thermal state (chilly / hot / mixed), dominant mental disposition
- [ ] PQRS symptom capture (Peculiar, Queer, Rare, Strange) — free text + tags
- [ ] Miasmatic background: Psora / Sycosis / Syphilis / Tubercular (checkbox + percentage)
- [ ] Constitutional profile visible on patient's profile header (summary chip)
- [ ] Updates to constitutional profile versioned (history preserved)

**SP:** 5 | **Priority:** P0

---

### US-02-03 · Comprehensive Case History (First Visit)
**As a** Doctor,  
**I want to** record a complete homeopathic case history for a new patient,  
**so that** I have the full symptom picture needed for remedy selection.

**Acceptance Criteria:**
- [ ] Sections: Chief Complaint, HPI, Past Medical History, Surgical History, Family History, Personal History (diet type, appetite, thirst, thermals, sleep, perspiration, desires, aversions, habits), Mental Generals, Physical Generals
- [ ] Auto-save every 60 seconds
- [ ] Doctor can attach up to 10 files (lab reports, old records)
- [ ] Case marked "In Progress" until submitted; submitted cases locked (Admin/Doctor can unlock)

**SP:** 8 | **Priority:** P0

---

### US-02-04 · Follow-Up Visit Recording
**As a** Doctor,  
**I want to** add a follow-up note to an existing patient's record,  
**so that** the response to previous treatment is tracked alongside the new prescription.

**Acceptance Criteria:**
- [ ] New visit entry added to timeline; previous visits read-only
- [ ] Fields: Chief Complaint update, changes since last visit (better / worse / same per symptom), vitals, new symptoms
- [ ] Previous prescription visible in side panel
- [ ] Doctor can copy & modify previous prescription
- [ ] Visit date/time auto-stamped; cannot be back-dated more than 24 hours

**SP:** 5 | **Priority:** P0

---

### US-02-05 · Patient Improvement Score
**As a** Doctor,  
**I want to** rate the patient's improvement at each follow-up visit on a 0–10 scale,  
**so that** I can objectively track treatment progress over time.

**Acceptance Criteria:**
- [ ] 0–10 slider (0 = much worse, 5 = no change, 10 = complete recovery) on every follow-up visit form
- [ ] Optional free-text note for the score
- [ ] Trend line chart on patient profile showing improvement score across visits
- [ ] If score ≤ 3 for 2 consecutive visits, system flags "Review Prescription" in red on patient profile
- [ ] Doctor can filter their patient list by "stagnant improvement" (score ≤ 4 for 2+ visits)

**SP:** 5 | **Priority:** P0

---

### US-02-06 · Remedy History Tracking
**As a** Doctor,  
**I want to** see a complete history of all remedies prescribed to a patient in one view,  
**so that** I avoid repeat prescriptions and track which remedies helped.

**Acceptance Criteria:**
- [ ] Dedicated "Remedy History" tab on patient profile
- [ ] Table: Visit Date | Remedy | Potency | Duration | Improvement Score at next visit
- [ ] Highlight remedies that were followed by improvement score ≥ 7 in green
- [ ] Highlight remedies with no improvement (score ≤ 3) in amber
- [ ] Searchable / filterable by remedy name
- [ ] Exportable as PDF for referral / second opinion

**SP:** 5 | **Priority:** P0

---

### US-02-07 · Patient Search & Quick Profile
**As a** Receptionist,  
**I want to** search for a patient by name, phone, or Patient ID,  
**so that** I can pull up their record instantly when they arrive.

**Acceptance Criteria:**
- [ ] Global search bar on all screens
- [ ] Results appear within 300ms after 2+ characters typed (fuzzy search)
- [ ] Result card: name, photo thumbnail, Patient ID, last visit date, upcoming appointment
- [ ] Works offline for last 200 patients (local cache)

**SP:** 3 | **Priority:** P0

---

### US-02-08 · Vitals Tracking & Trend Charts
**As a** Doctor,  
**I want to** record vitals at each visit and view trends,  
**so that** I can track weight and BP changes in chronic cases.

**Acceptance Criteria:**
- [ ] Fields: Weight (kg), Height (cm), BMI (auto-calculated), BP (systolic/diastolic), Temperature (°F), Pulse (bpm)
- [ ] Trend charts on patient profile for weight and BP over last 12 visits
- [ ] Values outside normal range highlighted in red with tooltip showing reference range

**SP:** 3 | **Priority:** P1

---

### US-02-09 · Document Upload & Management
**As a** Doctor or Receptionist,  
**I want to** upload external reports and documents to a patient's record,  
**so that** everything is accessible during consultation.

**Acceptance Criteria:**
- [ ] Supported formats: PDF, JPG, PNG (max 20 MB/file)
- [ ] Tagged with: doc type (Lab Report / X-Ray / Old Prescription / Other), date
- [ ] Preview in-browser; download option
- [ ] Doctor can add text annotation per document

**SP:** 5 | **Priority:** P1

---

### US-02-10 · Allergy & Contraindication Alert
**As a** Doctor,  
**I want to** see a patient's known allergies prominently on their profile,  
**so that** I don't accidentally prescribe something contraindicated.

**Acceptance Criteria:**
- [ ] Allergies field captured at registration and editable at any visit
- [ ] Allergy banner displayed at the top of the prescription form in amber
- [ ] Doctor must acknowledge the allergy banner before saving prescription

**SP:** 3 | **Priority:** P1

---

## E-03 · Appointment & Queue Management

**Goal:** Eliminate scheduling conflicts, reduce no-shows, and give patients queue visibility.

---

### US-03-01 · Book Appointment (Receptionist / Doctor)
**As a** Receptionist,  
**I want to** book an appointment for a patient by selecting date, time slot, and type,  
**so that** the doctor's calendar stays organised and the patient has a confirmed slot.

**Acceptance Criteria:**
- [ ] Calendar view showing available / booked / blocked slots in 15-min increments
- [ ] Appointment types: New Case, Follow-Up, Emergency
- [ ] Search or select existing patient (or register new inline)
- [ ] Double-booking prevention
- [ ] On save: slot blocked; WhatsApp confirmation auto-sent

**SP:** 5 | **Priority:** P0

---

### US-03-02 · Reschedule & Cancel Appointment
**As a** Receptionist,  
**I want to** reschedule or cancel an existing appointment,  
**so that** the slot is freed and the patient is notified immediately.

**Acceptance Criteria:**
- [ ] Original slot released atomically when rescheduled
- [ ] WhatsApp notification sent with updated or cancellation details
- [ ] Cancellation requires reason (Patient Request / Doctor Unavailable / Emergency / Other)
- [ ] Cancelled appointments shown in calendar in grey strikethrough
- [ ] Cancellations within 2 hours flagged in admin report

**SP:** 3 | **Priority:** P0

---

### US-03-03 · Token / Queue Management
**As a** Receptionist,  
**I want to** assign a token number when a patient arrives and manage the live queue,  
**so that** patients know their position and the clinic runs in order.

**Acceptance Criteria:**
- [ ] "Check In" converts appointment to token with sequential number
- [ ] Live queue board: Token | Patient Name | Status (Waiting / With Doctor / Done)
- [ ] Doctor marks "Done"; next patient gets WhatsApp "You Are Next"
- [ ] Walk-in patients can be added without a prior appointment
- [ ] Estimated wait time shown based on average consultation duration

**SP:** 5 | **Priority:** P1

---

### US-03-04 · Doctor's Daily Schedule View
**As a** Doctor,  
**I want to** see my appointment list for today at a glance,  
**so that** I know how many patients to expect and their case types.

**Acceptance Criteria:**
- [ ] List sorted by appointment time: time, name, age, type, last visit date
- [ ] Count of completed / remaining shown at top
- [ ] Click row opens patient profile with today's encounter pre-loaded
- [ ] Printable list view

**SP:** 3 | **Priority:** P0

---

### US-03-05 · Slot Blocking & Holidays
**As an** Admin,  
**I want to** block specific dates or time ranges on the doctor's calendar,  
**so that** patients cannot book during holidays or off-hours.

**Acceptance Criteria:**
- [ ] Block single slot, half-day, full day, or recurring (e.g., every Sunday)
- [ ] Add optional reason (Holiday / CME / Doctor Unavailable)
- [ ] Public booking widget hides blocked slots
- [ ] Warning if existing appointments fall in the block window (with patient notification option)

**SP:** 3 | **Priority:** P1

---

### US-03-06 · Multi-Source Appointment Booking Tracking
**As an** Admin,  
**I want to** see which channel each appointment came from (Reception / Website / WhatsApp / Mobile),  
**so that** I know which booking sources are most effective.

**Acceptance Criteria:**
- [ ] Source tag on every appointment record
- [ ] Booking source breakdown in appointment analytics report
- [ ] Each source has appropriate confirmation flow (see WhatsApp templates)

**SP:** 2 | **Priority:** P1

---

## E-04 · Homeopathic Clinical & Prescription Module

**Goal:** Speed up the prescription workflow with homeopathy-specific tools while maintaining clinical rigour.

---

### US-04-01 · Prescription Writing
**As a** Doctor,  
**I want to** write a prescription with remedy, potency, dose, and frequency,  
**so that** the patient and reception have clear dispensing instructions.

**Acceptance Criteria:**
- [ ] Fields: Remedy Name (autocomplete from catalog), Potency (LM1–LM30, 6C–CM, 6X–200X), Form (pills/drops/liquid), Dose, Frequency (OD/BD/TDS/SOS/Weekly), Duration, Anupan/Vehicle, Special Instructions
- [ ] Multiple remedies per prescription; intercurrent remedy section
- [ ] Dietary restrictions / antidotes to avoid auto-populated from remedy notes
- [ ] Preview prescription PDF before saving
- [ ] Prescription linked to visit entry

**SP:** 8 | **Priority:** P0

---

### US-04-02 · Common Disease Prescription Templates
**As a** Doctor,  
**I want to** start from a pre-built prescription template for common conditions,  
**so that** I can see patients faster without writing the same remedies from scratch every time.

**Acceptance Criteria:**
- [ ] Minimum 20 condition templates pre-loaded: Acne, Anxiety, Arthritis, Asthma, Back Pain, Constipation, Depression, Diabetes Support, Eczema, Hair Fall, IBS, Insomnia, Migraine, PCOD, Psoriasis, Sinusitis, Thyroid Support, UTI, Varicose Veins, Weight Gain
- [ ] Each template includes: condition name, 2–3 suggested remedies with typical potency and dose, dietary notes, lifestyle notes
- [ ] Doctor can edit any template field before saving
- [ ] Doctor can save their own custom templates (named, reusable)
- [ ] Template library is Admin-managed (add/edit/delete)

**SP:** 5 | **Priority:** P0

---

### US-04-03 · Prescription PDF Generation & WhatsApp Dispatch
**As a** Doctor,  
**I want to** generate a branded prescription PDF and send it to the patient via WhatsApp,  
**so that** the patient has a permanent digital copy.

**Acceptance Criteria:**
- [ ] PDF includes: clinic logo, doctor name & registration no., patient name & ID, date, remedy table, potency, dose, frequency, duration, dietary notes, follow-up date
- [ ] PDF generated in < 3 seconds
- [ ] "Send via WhatsApp" button triggers WATI API with PDF attachment
- [ ] Delivery status (Sent / Delivered / Read) tracked on prescription record
- [ ] PDF downloadable from system at any time

**SP:** 5 | **Priority:** P0

---

### US-04-04 · Improvement Score at Follow-Up
*(See US-02-05 — cross-referenced; captured on visit form and drives trend chart on patient profile)*

---

### US-04-05 · Symptom Repertorization (v1.2)
**As a** Doctor,  
**I want to** select symptoms from a repertory and see ranked remedy suggestions,  
**so that** I can arrive at the simillimum faster.

**Acceptance Criteria:**
- [ ] Search symptoms by rubric keyword (Kent / Synthesis repertory)
- [ ] Add symptoms to "Working Repertorization" tray; grade 1–3 each
- [ ] System calculates remedy score (sum of grades) and shows top 10 remedies
- [ ] Remedies link to Materia Medica quick-view
- [ ] Repertorization saved as read-only part of case notes

**SP:** 13 | **Priority:** v1.2

---

### US-04-06 · Materia Medica Quick Reference (v1.2)
**As a** Doctor,  
**I want to** look up key features of a remedy without leaving the prescription screen,  
**so that** I can confirm my selection in seconds.

**Acceptance Criteria:**
- [ ] Side panel: mental picture, physical generals, key symptoms, modalities, keynotes
- [ ] Source: Boericke's Materia Medica (open-source edition)
- [ ] Compare two remedies side-by-side
- [ ] Cached for offline use

**SP:** 5 | **Priority:** v1.2

---

### US-04-07 · Miasmatic Case Analysis (v1.2)
**As a** Doctor,  
**I want to** record a formal miasmatic analysis linked to a visit,  
**so that** the constitutional treatment plan is documented and traceable.

**Acceptance Criteria:**
- [ ] Checklist of miasmatic indicators per miasm (Psora, Sycosis, Syphilis, Tubercular)
- [ ] System calculates dominant miasm percentage
- [ ] Doctor can override with free-text justification
- [ ] Summary visible in all future visit records

**SP:** 5 | **Priority:** v1.2

---

### US-04-08 · Medical Certificate Generation
**As a** Doctor,  
**I want to** generate a signed medical certificate from a template,  
**so that** patients can receive it instantly without a separate visit.

**Acceptance Criteria:**
- [ ] Templates: Fitness Certificate, Sick Leave Certificate, Follow-Up Recommended, Custom
- [ ] Auto-fills: patient name, age, date, doctor name & registration number, dates
- [ ] Doctor adds custom free-text in a notes field
- [ ] Digital signature image embeds into PDF
- [ ] Sent via WhatsApp or downloaded

**SP:** 3 | **Priority:** P1

---

## E-05 · In-House Medicine Dispensing & Vendor Management

**Goal:** Track every remedy dispensed, charge it accurately, manage stock, and track supplier costs.

---

### US-05-01 · Medicine Inventory Management
**As an** Admin,  
**I want to** maintain a digital inventory of all homeopathic remedies with cost and selling price,  
**so that** I always know my stock value and margin.

**Acceptance Criteria:**
- [ ] Fields: Remedy Name, Potency, Form (pills/liquid/cream/powder), Brand, Batch No, Expiry Date, Quantity, **Cost Price**, **Selling Price**, Reorder Level, Vendor
- [ ] Expiry alert: ≤ 30 days → orange; expired → red
- [ ] Low-stock alert when quantity < reorder level (in-app + WhatsApp to admin)
- [ ] Bulk CSV import

**SP:** 5 | **Priority:** P0

---

### US-05-02 · Vendor / Supplier Management
**As an** Admin,  
**I want to** maintain a list of medicine suppliers with their contact and payment details,  
**so that** all purchase records are traceable to a specific vendor.

**Acceptance Criteria:**
- [ ] Vendor record: Name, Contact Person, Phone, Email, GSTIN, Address, Payment Terms, Delivery Lead Time
- [ ] CRUD interface in Settings > Vendors
- [ ] Vendor linked to each inventory item and purchase record
- [ ] "Vendor Report": total spend per vendor for selected date range

**SP:** 3 | **Priority:** P0

---

### US-05-03 · Medicine Purchase Record
**As an** Admin or Receptionist,  
**I want to** record a new medicine purchase against a vendor,  
**so that** stock increases and the expense is automatically captured.

**Acceptance Criteria:**
- [ ] Purchase form: Vendor (dropdown), Date, line items (medicine, quantity, cost price per unit)
- [ ] On save: inventory quantity incremented; expense entry auto-created under category "Medicine Purchase"
- [ ] Purchase order PDF downloadable
- [ ] Purchase history linked to vendor record

**SP:** 5 | **Priority:** P0

---

### US-05-04 · Dispense Medicines Against Prescription
**As a** Receptionist,  
**I want to** dispense medicines linked to the doctor's prescription and add charges to the patient's bill,  
**so that** dispensing and billing happen in one step.

**Acceptance Criteria:**
- [ ] "Dispense" button on prescription pulls inventory lookup for each prescribed remedy
- [ ] Receptionist confirms quantity; stock decremented instantly using selling price
- [ ] Out-of-stock: alert with substitution suggestion (same remedy, different brand)
- [ ] Dispensing record saved with timestamp and receptionist ID
- [ ] Each dispensed item added as invoice line item at selling price

**SP:** 5 | **Priority:** P0

---

## E-06 · Billing, Receipts & Payments

**Goal:** Generate accurate, GST-compliant invoices; support package plans; eliminate revenue leakage.

---

### US-06-01 · Create Patient Invoice
**As a** Receptionist,  
**I want to** create an invoice with all charges for a visit,  
**so that** the patient pays the correct amount and the clinic has a revenue record.

**Acceptance Criteria:**
- [ ] Auto-populated: Consultation Fee + dispensed medicines
- [ ] Add manual line items (procedure, certificate charge, etc.)
- [ ] Discount field (percentage or flat, with reason)
- [ ] GST calculation per line item
- [ ] Payment modes: Cash / UPI / Card / Net Banking / Pending / Mixed
- [ ] Invoice number auto-incremented (DRM/YYYY-YY/NNN)

**SP:** 5 | **Priority:** P0

---

### US-06-02 · Package / Treatment Plan Billing
**As an** Admin,  
**I want to** create multi-session treatment packages that patients can purchase upfront,  
**so that** patients commit to a full treatment course and the clinic gets advance revenue.

**Acceptance Criteria:**
- [ ] Admin creates package: Name (e.g., "3-Month Skin Programme"), Sessions Included, Package Price, Validity (days), Applicable Services
- [ ] Receptionist can sell a package to a patient (creates one invoice for full amount)
- [ ] Patient's package balance (sessions remaining) visible on their profile
- [ ] Each visit deducts one session from the package balance
- [ ] Alert when patient has 1 session remaining (prompt to renew)
- [ ] Package utilisation report for Admin

**SP:** 8 | **Priority:** P0

---

### US-06-03 · Receipt Generation & WhatsApp Delivery
**As a** Receptionist,  
**I want to** generate a PDF receipt after payment and send it via WhatsApp,  
**so that** the patient has proof of payment.

**Acceptance Criteria:**
- [ ] Receipt PDF: clinic name/logo/GSTIN, receipt number, date, patient name, itemised charges, payment mode, amount paid, balance due
- [ ] Generated in < 2 seconds
- [ ] Print option: thermal 80mm format
- [ ] "Send WhatsApp" sends PDF via approved template

**SP:** 5 | **Priority:** P0

---

### US-06-04 · Outstanding Dues Tracking & Reminder
**As a** Receptionist,  
**I want to** see patients with outstanding balances and send them a payment reminder,  
**so that** pending collections are followed up systematically.

**Acceptance Criteria:**
- [ ] Dues tab: patient name, invoice no., date, total, paid, balance
- [ ] Filter by amount range, date range
- [ ] "Record Payment" button for partial/full settlement
- [ ] "Send WhatsApp Reminder" button per row sends payment reminder template

**SP:** 3 | **Priority:** P1

---

## E-07 · WhatsApp Communication Hub

**Goal:** Use WhatsApp as the primary patient communication channel for all clinical and administrative outputs.

---

### US-07-01 · Appointment Confirmation
**As a** patient,  
**I want to** receive a WhatsApp confirmation immediately after my appointment is booked,  
**so that** I have the details saved on my phone.

**Acceptance Criteria:**
- [ ] Sent within 60 seconds of booking
- [ ] Includes: clinic name, date, time, doctor name, address
- [ ] Patient can reply CANCEL to trigger cancellation workflow
- [ ] Delivery status tracked in appointment record

**SP:** 3 | **Priority:** P0

---

### US-07-02 · 24-Hour Appointment Reminder
**As a** patient,  
**I want to** receive a WhatsApp reminder 24 hours before my appointment,  
**so that** I don't forget and the clinic reduces no-shows.

**Acceptance Criteria:**
- [ ] Scheduled job runs every 30 minutes; sends for appointments in next 24–25 hrs
- [ ] Template includes date, time, clinic address, Google Maps link
- [ ] Suppressed if appointment cancelled / rescheduled before reminder fires
- [ ] Patients who opted out do not receive reminders

**SP:** 3 | **Priority:** P0

---

### US-07-03 · "You Are Next" Queue Notification
**As a** patient,  
**I want to** receive a WhatsApp message when I am next in the queue,  
**so that** I can come to the doctor's room on time.

**Acceptance Criteria:**
- [ ] Triggered when doctor marks the previous patient as "Done"
- [ ] Template: patient name, token number, clinic name
- [ ] If patient does not arrive within 10 minutes, Receptionist sees a "Patient Not Arrived" flag

**SP:** 2 | **Priority:** P1

---

### US-07-04 · Prescription & Wellness Plan Dispatch
*(See US-04-03 and E-09 — prescription and diet/yoga plan sent via WhatsApp in one tap)*

---

### US-07-05 · Follow-Up Reminder (D-2 and D-0)
**As a** patient,  
**I want to** receive a WhatsApp reminder when my follow-up is due,  
**so that** I book my next appointment on time.

**Acceptance Criteria:**
- [ ] D-2 reminder: "Your follow-up with Dr. X is due in 2 days. Book here: [link]"
- [ ] D-0 reminder: sent on due date if no appointment booked
- [ ] Reminders respect opt-in/opt-out

**SP:** 3 | **Priority:** P0

---

### US-07-06 · Birthday Wishes
**As a** patient,  
**I want to** receive a birthday greeting from the clinic on my birthday,  
**so that** I feel valued and maintain a positive relationship with the clinic.

**Acceptance Criteria:**
- [ ] Daily scheduled job checks patients with DOB = today
- [ ] Sends birthday wishes WhatsApp template (with clinic branding)
- [ ] Can optionally include a birthday discount offer (configured by Admin)
- [ ] Opt-in status respected

**SP:** 2 | **Priority:** P1

---

### US-07-07 · Medicine Refill Reminder
**As a** patient,  
**I want to** receive a WhatsApp reminder when my medicine is about to run out,  
**so that** I don't miss doses due to running out of stock.

**Acceptance Criteria:**
- [ ] When prescription is saved with a duration (e.g., 15 days), system calculates refill date
- [ ] 2 days before refill date: WhatsApp template "Your medicine supply from Dr. X is running low. Visit us or call to refill."
- [ ] Refill reminder also shown as a task for Receptionist
- [ ] If patient re-visits before refill date, reminder is cancelled

**SP:** 3 | **Priority:** P1

---

### US-07-08 · Payment Receipt via WhatsApp
*(See US-06-03 — receipt PDF sent via approved WhatsApp template)*

---

### US-07-09 · WhatsApp Broadcast Campaign
**As an** Admin or Receptionist,  
**I want to** send a WhatsApp broadcast to a filtered group of patients,  
**so that** I can share health tips, seasonal promotions, or health camp announcements.

**Acceptance Criteria:**
- [ ] Filter recipients: all patients / chronic cases / last visit > 3 months / age range / condition tag
- [ ] Select pre-approved template
- [ ] Preview before sending; schedule or send immediately
- [ ] Campaign report: sent / delivered / read / failed
- [ ] Rate limit: max 1 broadcast per patient per day

**SP:** 8 | **Priority:** v1.1

---

### US-07-10 · Two-Way WhatsApp Inbox
**As a** Receptionist,  
**I want to** see and reply to patient WhatsApp messages in a shared inbox,  
**so that** I handle queries without switching to a personal phone.

**Acceptance Criteria:**
- [ ] Unified inbox sorted by latest message; unread count badge
- [ ] Search by patient name or phone
- [ ] Quick replies (saved canned responses)
- [ ] Assign conversation to a staff member
- [ ] 24-hour session window warning (WhatsApp policy)
- [ ] All messages logged to patient's communication history

**SP:** 8 | **Priority:** v1.1

---

## E-08 · Lead Management CRM

**Goal:** Capture every enquiry from all channels and convert them systematically into patients.

---

### US-08-01 · Lead Capture & Registration
**As a** Receptionist,  
**I want to** register a new lead when someone enquires,  
**so that** no potential patient is forgotten.

**Acceptance Criteria:**
- [ ] Quick form: Name, Phone, Condition / Complaint, Source (Website / WhatsApp / Walk-in / **Google Ads** / Referral / Social Media), Assigned To
- [ ] Lead auto-created from website booking form if visitor doesn't complete booking
- [ ] Lead auto-created from WhatsApp click-to-chat (webhook)
- [ ] Duplicate detection by phone number

**SP:** 5 | **Priority:** v1.1

---

### US-08-02 · Lead Pipeline (Kanban)
**As a** Receptionist,  
**I want to** see all leads in a Kanban pipeline,  
**so that** I can prioritise follow-ups and track progress.

**Acceptance Criteria:**
- [ ] Columns: New → Contacted → Appointment Booked → **Consultation Completed** → Converted → Lost
- [ ] Drag-and-drop between stages
- [ ] Card: name, complaint, source, assigned to, days since created
- [ ] Filter by staff, source, date
- [ ] Overdue leads (no activity > 2 days) highlighted in red

**SP:** 5 | **Priority:** v1.1

---

### US-08-03 · Lead → Patient Conversion
**As a** Receptionist,  
**I want to** convert a lead to a patient with one click,  
**so that** I don't re-enter their details.

**Acceptance Criteria:**
- [ ] "Convert to Patient" on lead card pre-fills registration form
- [ ] Lead status set to Converted; patient record created; appointment screen opens
- [ ] Conversion rate tracked per source in lead analytics

**SP:** 3 | **Priority:** v1.1

---

### US-08-04 · Lead Source Analytics
**As an** Admin,  
**I want to** see a report of leads by source with conversion rates,  
**so that** I know which marketing channels (including Google Ads) are worth investing in.

**Acceptance Criteria:**
- [ ] Table: Source | Total Leads | Contacted | Converted | Lost | Conversion Rate %
- [ ] Bar chart of leads by source
- [ ] Filter by date range
- [ ] Export CSV

**SP:** 3 | **Priority:** v1.1

---

## E-09 · Diet Chart & Yoga Library

**Goal:** Empower doctors to prescribe holistic lifestyle recommendations in under 2 minutes.

---

### US-09-01 · Diet Chart Builder
**As a** Doctor,  
**I want to** build a personalised diet chart using templates and customise it,  
**so that** the patient has clear food guidance alongside their medication.

**Acceptance Criteria:**
- [ ] Condition-based templates: Diabetes, Hypertension, Obesity, PCOD, Psoriasis, IBS, Thyroid, Anaemia, General Detox (minimum 9 templates)
- [ ] Template loaded and editable: rows of (Food Category | Allowed | Avoid)
- [ ] Add/remove/edit rows; add custom note at bottom
- [ ] Save to patient record; generate PDF + send via WhatsApp

**SP:** 5 | **Priority:** v1.1

---

### US-09-02 · Yoga Asana Library & Prescription
**As a** Doctor,  
**I want to** prescribe specific yoga asanas from a curated library,  
**so that** patients get a personalised yoga plan for their condition.

**Acceptance Criteria:**
- [ ] Library: minimum 60 asanas — name (English + Sanskrit), description, step-by-step, benefits, contraindications, difficulty, condition tags, body region tags, image
- [ ] Filter by condition tag, difficulty, body region
- [ ] Add to patient plan with: duration (seconds), reps, frequency per day, notes
- [ ] Yoga plan + diet chart bundled into single Wellness PDF
- [ ] Sent via WhatsApp "wellness_plan" template

**SP:** 8 | **Priority:** v1.1

---

### US-09-03 · Admin — Manage Diet & Yoga Content
**As an** Admin,  
**I want to** add, edit, and delete diet templates and yoga asanas,  
**so that** the content library stays current.

**Acceptance Criteria:**
- [ ] CRUD for diet templates and yoga asanas
- [ ] Rich text editor for asana descriptions
- [ ] Image upload for asana photos (JPG/PNG, max 2 MB)
- [ ] Changes take effect immediately for all doctors

**SP:** 3 | **Priority:** v1.1

---

## E-10 · Follow-Up & Escalation Engine

**Goal:** Ensure no patient falls through the cracks after their visit, with escalating nudges for non-responders.

---

### US-10-01 · Set Follow-Up Date
**As a** Doctor,  
**I want to** set a follow-up date at the end of each visit,  
**so that** the patient knows when to return and the system can send reminders.

**Acceptance Criteria:**
- [ ] Quick-select: 2 Weeks / 1 Month / 6 Weeks / 3 Months / Custom
- [ ] Follow-up date auto-prints on prescription PDF
- [ ] Task created and assigned to Receptionist

**SP:** 2 | **Priority:** P0

---

### US-10-02 · Overdue Follow-Up Dashboard
**As a** Receptionist,  
**I want to** see patients whose follow-up date has passed without a new appointment,  
**so that** I can proactively reach out.

**Acceptance Criteria:**
- [ ] List sorted by most overdue first
- [ ] Columns: Patient Name, Doctor, Follow-up Due Date, Days Overdue, Last Visit, Actions
- [ ] Actions: Book Appointment / Send WhatsApp Reminder / Mark as Lost
- [ ] Count of overdue patients shown as badge on Receptionist dashboard

**SP:** 3 | **Priority:** v1.1

---

### US-10-03 · Escalation Reminder
**As a** Receptionist,  
**I want to** get a high-priority alert when a patient is 3+ days overdue on their follow-up,  
**so that** patients who are at risk of dropping out of treatment are prioritised.

**Acceptance Criteria:**
- [ ] If no appointment is booked 3 days after follow-up due date:
  - Patient receives a second "escalation" WhatsApp (different, more urgent template)
  - Receptionist receives in-app high-priority flag (red badge) for that patient
- [ ] If no appointment booked after 7 days: Doctor notified with patient name and days overdue
- [ ] Escalation reminders respect opt-in/opt-out

**SP:** 3 | **Priority:** v1.1

---

## E-11 · Financial Management & Reports

**Goal:** Give the clinic owner real-time visibility into revenue, expenses, vendor costs, and profitability.

---

### US-11-01 · Record Daily Expenses
**As a** Receptionist,  
**I want to** log daily clinic expenses with optional vendor linkage,  
**so that** all costs are tracked and the admin can review them.

**Acceptance Criteria:**
- [ ] Form: Date, Category (Rent / Salary / Medicine Purchase / Electricity / Marketing / Equipment / Misc), Description, Amount, Payment Mode, Vendor (optional), Receipt Upload
- [ ] Submitted expenses: Pending Approval → Approved / Rejected by Admin
- [ ] Admin notified for expenses > ₹500

**SP:** 3 | **Priority:** v1.1

---

### US-11-02 · Income Summary
**As an** Admin,  
**I want to** see a daily income summary broken down by income type,  
**so that** I know where revenue is coming from.

**Acceptance Criteria:**
- [ ] Daily view: Consultation | Medicine Sales | Package Plans | Certificate Charges | Other
- [ ] Comparison with previous day and same day last week
- [ ] Payment mode breakdown (Cash / UPI / Card / Net Banking)
- [ ] Pending / outstanding clearly separated from collected amounts

**SP:** 3 | **Priority:** v1.1

---

### US-11-03 · Monthly P&L Report
**As an** Admin,  
**I want to** generate a monthly Profit & Loss report,  
**so that** I can understand the financial health of the clinic.

**Acceptance Criteria:**
- [ ] Total Revenue (by type), Total Expenses (by category), Gross Profit, Net Profit
- [ ] Month-over-month comparison (current vs previous 3 months)
- [ ] Revenue vs expenses trend chart
- [ ] Export PDF and Excel
- [ ] Shareable password-protected link for accountant

**SP:** 5 | **Priority:** v1.1

---

### US-11-04 · Vendor Spend Report
**As an** Admin,  
**I want to** see total spend per vendor over a selected period,  
**so that** I can negotiate better terms or identify over-spending.

**Acceptance Criteria:**
- [ ] Table: Vendor | Purchase Count | Total Spend | Last Purchase Date
- [ ] Drill down to individual purchase records per vendor
- [ ] Export CSV

**SP:** 3 | **Priority:** v1.1

---

### US-11-05 · GST Liability Report (v1.2)
**As an** Admin,  
**I want to** see output GST collected and input GST on expenses,  
**so that** I can file returns accurately.

**Acceptance Criteria:**
- [ ] Summary: Output GST (by rate), Input GST (on expenses), Net GST Payable
- [ ] Detailed transaction list downloadable as CSV
- [ ] Filter by month
- [ ] Note: consultation fees typically GST-exempt (configurable toggle per item type)

**SP:** 5 | **Priority:** v1.2

---

## E-12 · Analytics & Admin Dashboard

**Goal:** Give the Admin a live command-centre view of clinic performance and patient trends.

---

### US-12-01 · Admin Home Dashboard
**As an** Admin,  
**I want to** see key clinic metrics on my home screen,  
**so that** I can spot problems without digging into reports.

**Acceptance Criteria:**
- [ ] KPI tiles (today): Appointments (booked / attended / cancelled), Collections (₹), New Patients, Leads, **Top Disease Treated this week**, **Lead Conversion Rate %**
- [ ] Trend sparklines: last 7 days
- [ ] Alerts: low stock, overdue follow-ups, pending expense approvals, outstanding dues > ₹5,000
- [ ] Quick actions: Add Patient, Book Appointment, Record Expense
- [ ] Auto-refreshes every 5 minutes

**SP:** 8 | **Priority:** v1.2

---

### US-12-02 · Patient Analytics
**As an** Admin,  
**I want to** analyse patient demographics and disease patterns,  
**so that** I can identify growth trends and focus marketing.

**Acceptance Criteria:**
- [ ] Total patients (all time / this month / new this month)
- [ ] Gender breakdown (pie chart)
- [ ] Age group distribution (bar chart)
- [ ] **Top 10 conditions / chief complaints** treated (ranked bar chart)
- [ ] New vs Returning patient ratio (line chart, last 12 months)
- [ ] Average patient improvement score across all active chronic cases

**SP:** 5 | **Priority:** v1.2

---

### US-12-03 · Appointment & No-Show Analytics
**As an** Admin,  
**I want to** analyse appointment trends including no-shows,  
**so that** I can optimise slot availability and reduce no-shows.

**Acceptance Criteria:**
- [ ] Booked vs Attended vs Cancelled vs **No-Show** rates by month (dedicated no-show report)
- [ ] Busiest days and times (heat map)
- [ ] Average lead time to book
- [ ] No-show rate trend line; alert if no-show rate > 15% in a week

**SP:** 5 | **Priority:** v1.2

---

## E-13 · Online Booking Widget (Public-Facing)

**Goal:** Allow patients to self-book from the clinic website, reducing receptionist load by 40%+.

---

### US-13-01 · Embeddable Booking Widget
**As a** website visitor,  
**I want to** book an appointment from the clinic website,  
**so that** I can reserve a slot without calling.

**Acceptance Criteria:**
- [ ] Embeddable via `<script>` tag or `<iframe>` on any website
- [ ] Flow: Select Date → Select Slot → Enter Details (Name, Phone, Complaint) → Confirm
- [ ] Only shows available slots (respects existing bookings and blocked times)
- [ ] On submit: appointment created as "Pending Confirmation"
- [ ] Receptionist receives in-app + push notification
- [ ] Patient receives WhatsApp confirmation once confirmed
- [ ] Mobile-responsive

**SP:** 8 | **Priority:** v1.1

---

### US-13-02 · Booking Widget Configuration
**As an** Admin,  
**I want to** configure the booking widget's branding and constraints,  
**so that** it matches the clinic and prevents impractical bookings.

**Acceptance Criteria:**
- [ ] Customise: clinic name, logo, primary colour, contact phone
- [ ] Set: min advance booking (hrs), max advance booking (days), slot duration (10/15/20/30 min)
- [ ] Copy embed code with one click
- [ ] Preview widget in settings page

**SP:** 3 | **Priority:** v1.1

---

## E-14 · Push Notifications (Staff)

**Goal:** Keep all staff instantly informed of critical events without requiring them to constantly check the app.

---

### US-14-01 · Push Notification Setup & Preferences
**As a** staff member,  
**I want to** configure which push notifications I receive,  
**so that** I get relevant alerts without being overwhelmed.

**Acceptance Criteria:**
- [ ] Firebase Cloud Messaging integrated for web (service worker) and mobile
- [ ] Notification types configurable per role:
  - New appointment from website widget (Receptionist + Admin)
  - Low stock alert (Admin + Receptionist)
  - New lead received (Receptionist + Admin)
  - Overdue follow-up (high priority) (Receptionist)
  - Expense awaiting approval (Admin)
  - New WhatsApp message received (Receptionist)
- [ ] Staff can toggle each notification type on/off in Profile > Notification Settings
- [ ] Notifications also appear as in-app bell icon with badge count

**SP:** 5 | **Priority:** v1.1

---

## E-15 · AI Features (Phase 3 — v3.0)

**Goal:** Layer intelligence on top of accumulated clinic data to reduce doctor workload and improve outcomes.

---

### US-15-01 · AI Prescription Suggestions
**As a** Doctor,  
**I want to** receive AI-powered remedy suggestions based on the patient's symptom input,  
**so that** I can validate my clinical reasoning faster.

**Acceptance Criteria:**
- [ ] After case notes are saved, AI analyses chief complaint, generals, and past remedy history
- [ ] Suggests top 3 remedies with reasoning (based on pattern matching from anonymised clinic data + Materia Medica)
- [ ] Doctor can accept (populates prescription form) or dismiss a suggestion
- [ ] AI suggestions logged for model improvement; doctor acceptance rate tracked
- [ ] Clearly labelled as "AI Suggestion — Verify Clinically" (not a replacement for clinical judgement)

**SP:** 13 | **Priority:** v3.0

---

### US-15-02 · AI Follow-Up Risk Prediction
**As a** Doctor,  
**I want to** see which patients are at high risk of dropping out of treatment,  
**so that** I can intervene before they become lost cases.

**Acceptance Criteria:**
- [ ] Model trained on: visit frequency, improvement scores, follow-up compliance, appointment no-show history
- [ ] Each active patient gets a Risk Score (Low / Medium / High) updated weekly
- [ ] High-risk patients flagged on Doctor and Receptionist dashboards
- [ ] Suggested action per patient (e.g., "Call patient", "Send personal message from doctor")

**SP:** 13 | **Priority:** v3.0

---

### US-15-03 · AI Lead Scoring
**As a** Receptionist,  
**I want to** see which leads are most likely to convert,  
**so that** I prioritise my follow-up calls.

**Acceptance Criteria:**
- [ ] Each lead gets a conversion probability score (High / Medium / Low)
- [ ] Based on: source, complaint type, response time, engagement
- [ ] Leads sorted by score in Kanban view by default
- [ ] Score re-calculated when lead activity is updated

**SP:** 8 | **Priority:** v3.0

---

### US-15-04 · Voice-to-Consultation Notes
**As a** Doctor,  
**I want to** dictate consultation notes by voice and have them transcribed,  
**so that** I can focus on the patient instead of typing.

**Acceptance Criteria:**
- [ ] Microphone button on case notes form initiates recording
- [ ] Speech-to-text transcription (Whisper API or equivalent) displayed in real time
- [ ] Doctor reviews and edits transcript before saving
- [ ] Supports medical terminology and remedy names
- [ ] Works in English; Marathi support in v3.1

**SP:** 8 | **Priority:** v3.0

---

## Story Point Summary

| Epic | SP | Phase |
|------|----|-------|
| E-01 User Management | 13 | MVP |
| E-02 Patient EMR | 37 | MVP |
| E-03 Appointments | 19 | MVP |
| E-04 Clinical Module | 44 | MVP + v1.2 |
| E-05 Dispensing + Vendor | 18 | MVP |
| E-06 Billing + Packages | 21 | MVP |
| E-07 WhatsApp | 30 | MVP + v1.1 |
| E-08 Lead CRM | 16 | v1.1 |
| E-09 Diet & Yoga | 16 | v1.1 |
| E-10 Follow-Up + Escalation | 8 | P0 + v1.1 |
| E-11 Financial | 19 | v1.1 |
| E-12 Analytics | 18 | v1.2 |
| E-13 Booking Widget | 11 | v1.1 |
| E-14 Push Notifications | 5 | v1.1 |
| E-15 AI Features | 42 | v3.0 |
| **TOTAL** | **317** | |

### MVP Scope (E-01 to E-06 + core E-07 + E-10 base)
**~130 SP ≈ 13 weeks for a 2-developer team**

### MVP Must-Haves
- Authentication & RBAC
- Patient registration + constitutional profile + improvement scale + remedy history
- Appointment booking + queue
- Prescription writing + disease templates
- In-house inventory + vendor management + dispensing
- Billing + package plans + receipts
- WhatsApp: confirmation, reminder, prescription dispatch, receipt

### v1.1 Nice-to-Haves
- Diet & Yoga library
- Lead CRM (with Google Ads source)
- Follow-up escalation
- Online booking widget
- WhatsApp inbox + campaigns + birthday + refill
- Financial reports + vendor spend
- Push notifications
- Mobile app
