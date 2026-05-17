# DrMan.ai — Database Schema (PostgreSQL / Supabase)

**Version:** 1.0 | **Date:** 2026-05-16

All tables include `created_at TIMESTAMPTZ DEFAULT now()` and `updated_at TIMESTAMPTZ DEFAULT now()` unless noted.  
All tables are scoped to `clinic_id` for multi-clinic readiness (v2.0).  
UUID primary keys used throughout.

---

## Tables

### 1. clinics
```sql
CREATE TABLE clinics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  address         TEXT,
  phone           TEXT,
  email           TEXT,
  gstin           TEXT,
  logo_url        TEXT,
  whatsapp_number TEXT,
  timezone        TEXT DEFAULT 'Asia/Kolkata',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 2. users (staff accounts)
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id   UUID NOT NULL REFERENCES clinics(id),
  full_name   TEXT NOT NULL,
  phone       TEXT NOT NULL UNIQUE,
  email       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
  is_active   BOOLEAN DEFAULT true,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_clinic ON users(clinic_id);
```

---

### 3. patients
```sql
CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  patient_code    TEXT NOT NULL UNIQUE,          -- e.g. DRM-2026-00001
  full_name       TEXT NOT NULL,
  date_of_birth   DATE,
  gender          TEXT CHECK (gender IN ('male','female','other')),
  phone           TEXT NOT NULL,
  email           TEXT,
  address         TEXT,
  occupation      TEXT,
  referred_by     TEXT,
  photo_url       TEXT,
  whatsapp_optin  BOOLEAN DEFAULT true,
  case_type       TEXT CHECK (case_type IN ('chronic','acute','new')),
  registered_by   UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_patients_clinic   ON patients(clinic_id);
CREATE INDEX idx_patients_phone    ON patients(phone);
CREATE INDEX idx_patients_name_trgm ON patients USING gin (full_name gin_trgm_ops);
```

---

### 4. visits
```sql
CREATE TABLE visits (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         UUID NOT NULL REFERENCES clinics(id),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  doctor_id         UUID NOT NULL REFERENCES users(id),
  visit_date        TIMESTAMPTZ NOT NULL DEFAULT now(),
  visit_type        TEXT CHECK (visit_type IN ('new_case','followup','emergency')),
  chief_complaint   TEXT,
  changes_since_last TEXT,
  status            TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','locked')),
  followup_date     DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_visits_patient  ON visits(patient_id);
CREATE INDEX idx_visits_doctor   ON visits(doctor_id);
CREATE INDEX idx_visits_date     ON visits(visit_date);
```

---

### 5. case_history (one row per patient — updated each visit)
```sql
CREATE TABLE case_history (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL UNIQUE REFERENCES patients(id),
  -- History sections
  hopi                TEXT,   -- History of Present Illness
  past_history        TEXT,
  surgical_history    TEXT,
  family_history      TEXT,
  -- Personal history
  diet_type           TEXT CHECK (diet_type IN ('veg','non-veg','vegan','mixed')),
  appetite            TEXT,
  thirst              TEXT,
  sleep               TEXT,
  thermals            TEXT,
  perspiration        TEXT,
  desires             TEXT[],
  aversions           TEXT[],
  habits              TEXT,
  -- Generals
  mental_generals     TEXT,
  physical_generals   TEXT,
  -- Miasmatic background
  miasm_psora         INTEGER DEFAULT 0,   -- percentage 0-100
  miasm_sycosis       INTEGER DEFAULT 0,
  miasm_syphilis      INTEGER DEFAULT 0,
  miasm_tubercular    INTEGER DEFAULT 0,
  dominant_miasm      TEXT,
  miasm_notes         TEXT,
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

---

### 6. vitals
```sql
CREATE TABLE vitals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id      UUID NOT NULL REFERENCES visits(id),
  patient_id    UUID NOT NULL REFERENCES patients(id),
  weight_kg     DECIMAL(5,2),
  height_cm     DECIMAL(5,1),
  bmi           DECIMAL(4,1),
  bp_systolic   INTEGER,
  bp_diastolic  INTEGER,
  temperature_f DECIMAL(4,1),
  pulse_bpm     INTEGER,
  recorded_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vitals_patient ON vitals(patient_id);
```

---

### 7. prescriptions
```sql
CREATE TABLE prescriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id        UUID NOT NULL REFERENCES visits(id),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  doctor_id       UUID NOT NULL REFERENCES users(id),
  pdf_url         TEXT,
  dietary_notes   TEXT,
  followup_date   DATE,
  whatsapp_sent   BOOLEAN DEFAULT false,
  whatsapp_status TEXT DEFAULT 'not_sent',  -- sent/delivered/read/failed
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE prescription_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  remedy_name     TEXT NOT NULL,
  potency         TEXT NOT NULL,   -- e.g. '30C', '200CH', 'LM1'
  form            TEXT,            -- pills/drops/liquid/cream
  dose            TEXT,            -- e.g. '4 pills'
  frequency       TEXT,            -- OD/BD/TDS/SOS/weekly
  duration        TEXT,            -- e.g. '15 days'
  anupan          TEXT,            -- vehicle (warm water, milk, etc.)
  instructions    TEXT,
  is_intercurrent BOOLEAN DEFAULT false,
  sort_order      INTEGER DEFAULT 0
);
```

---

### 8. appointments
```sql
CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  patient_id      UUID REFERENCES patients(id),
  doctor_id       UUID NOT NULL REFERENCES users(id),
  booked_by       UUID REFERENCES users(id),   -- null = patient self-booked
  appointment_date DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  type            TEXT DEFAULT 'followup' CHECK (type IN ('new_case','followup','emergency')),
  status          TEXT DEFAULT 'confirmed'
                  CHECK (status IN ('pending_confirmation','confirmed','checked_in',
                                    'with_doctor','completed','cancelled','no_show')),
  reason          TEXT,
  cancel_reason   TEXT,
  token_number    INTEGER,
  confirmation_sent  BOOLEAN DEFAULT false,
  reminder_sent      BOOLEAN DEFAULT false,
  source          TEXT DEFAULT 'staff'  -- staff / website_widget / whatsapp
    CHECK (source IN ('staff','website_widget','whatsapp')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appt_date_doctor ON appointments(appointment_date, doctor_id);
CREATE INDEX idx_appt_patient     ON appointments(patient_id);
CREATE UNIQUE INDEX idx_appt_token
  ON appointments(clinic_id, appointment_date, token_number)
  WHERE token_number IS NOT NULL;
```

---

### 9. inventory (medicine stock)
```sql
CREATE TABLE inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  remedy_name     TEXT NOT NULL,
  potency         TEXT,
  form            TEXT CHECK (form IN ('pills','liquid','cream','powder','other')),
  brand           TEXT,
  batch_number    TEXT,
  expiry_date     DATE,
  quantity        INTEGER NOT NULL DEFAULT 0,
  unit            TEXT DEFAULT 'unit',
  unit_price      DECIMAL(10,2) NOT NULL,
  reorder_level   INTEGER DEFAULT 10,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_clinic  ON inventory(clinic_id);
CREATE INDEX idx_inventory_expiry  ON inventory(expiry_date);
```

---

### 10. inventory_movements
```sql
CREATE TABLE inventory_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id    UUID NOT NULL REFERENCES inventory(id),
  movement_type   TEXT CHECK (movement_type IN ('stock_in','dispensed','adjusted','expired')),
  quantity        INTEGER NOT NULL,   -- positive = in, negative = out
  reference_id    UUID,               -- prescription_id or purchase_id
  notes           TEXT,
  performed_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 11. invoices
```sql
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  visit_id        UUID REFERENCES visits(id),
  invoice_number  TEXT NOT NULL UNIQUE,   -- e.g. DRM/2026-27/001
  invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal        DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,
  gst_amount      DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2) NOT NULL,
  amount_paid     DECIMAL(10,2) DEFAULT 0,
  balance_due     DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  payment_mode    TEXT CHECK (payment_mode IN ('cash','upi','card','pending','mixed')),
  status          TEXT DEFAULT 'unpaid'
                  CHECK (status IN ('unpaid','partial','paid','cancelled')),
  pdf_url         TEXT,
  whatsapp_sent   BOOLEAN DEFAULT false,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoice_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_type       TEXT CHECK (item_type IN ('consultation','medicine','certificate','other')),
  description     TEXT NOT NULL,
  quantity        INTEGER DEFAULT 1,
  unit_price      DECIMAL(10,2) NOT NULL,
  gst_rate        DECIMAL(4,2) DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL,
  inventory_id    UUID REFERENCES inventory(id)
);

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  amount          DECIMAL(10,2) NOT NULL,
  payment_mode    TEXT NOT NULL,
  payment_date    TIMESTAMPTZ DEFAULT now(),
  reference_no    TEXT,   -- UPI transaction ID, card last 4, etc.
  received_by     UUID REFERENCES users(id)
);
```

---

### 12. leads
```sql
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  full_name       TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  complaint       TEXT,
  source          TEXT CHECK (source IN ('website','whatsapp','walk_in','referral','social_media','other')),
  status          TEXT DEFAULT 'new'
                  CHECK (status IN ('new','contacted','appointment_booked','converted','lost')),
  assigned_to     UUID REFERENCES users(id),
  followup_date   DATE,
  notes           TEXT,
  patient_id      UUID REFERENCES patients(id),  -- set on conversion
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_clinic  ON leads(clinic_id);
CREATE INDEX idx_leads_status  ON leads(status);
```

---

### 13. expenses
```sql
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  expense_date    DATE NOT NULL,
  category        TEXT CHECK (category IN ('rent','salary','utilities','supplies',
                                           'marketing','equipment','miscellaneous')),
  description     TEXT NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  payment_mode    TEXT CHECK (payment_mode IN ('cash','upi','card','bank_transfer')),
  receipt_url     TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  submitted_by    UUID REFERENCES users(id),
  approved_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 14. whatsapp_messages
```sql
CREATE TABLE whatsapp_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  patient_id      UUID REFERENCES patients(id),
  direction       TEXT CHECK (direction IN ('outbound','inbound')),
  template_name   TEXT,
  message_body    TEXT,
  media_url       TEXT,
  wati_message_id TEXT,
  status          TEXT DEFAULT 'queued'
                  CHECK (status IN ('queued','sent','delivered','read','failed')),
  sent_by         UUID REFERENCES users(id),
  sent_at         TIMESTAMPTZ DEFAULT now(),
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ
);

CREATE INDEX idx_wa_patient  ON whatsapp_messages(patient_id);
CREATE INDEX idx_wa_clinic   ON whatsapp_messages(clinic_id);
```

---

### 15. diet_templates
```sql
CREATE TABLE diet_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID REFERENCES clinics(id),  -- null = global template
  name            TEXT NOT NULL,
  condition_tags  TEXT[],
  items           JSONB NOT NULL DEFAULT '[]',
  -- items structure: [{ category, allowed: [], avoid: [], notes }]
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE patient_diet_charts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id        UUID NOT NULL REFERENCES visits(id),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  template_id     UUID REFERENCES diet_templates(id),
  custom_items    JSONB,
  notes           TEXT,
  pdf_url         TEXT,
  whatsapp_sent   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 16. yoga_asanas
```sql
CREATE TABLE yoga_asanas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_english      TEXT NOT NULL,
  name_sanskrit     TEXT,
  description       TEXT,
  instructions      TEXT,
  benefits          TEXT[],
  contraindications TEXT[],
  condition_tags    TEXT[],
  body_region_tags  TEXT[],
  difficulty        TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  image_url         TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE patient_yoga_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id        UUID NOT NULL REFERENCES visits(id),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  asanas          JSONB NOT NULL DEFAULT '[]',
  -- asanas: [{ asana_id, duration_seconds, reps, frequency_per_day, notes }]
  notes           TEXT,
  pdf_url         TEXT,
  whatsapp_sent   BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 17. documents (patient file uploads)
```sql
CREATE TABLE patient_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  visit_id        UUID REFERENCES visits(id),
  doc_type        TEXT CHECK (doc_type IN ('lab_report','xray','old_prescription','other')),
  file_name       TEXT NOT NULL,
  file_url        TEXT NOT NULL,
  file_size_bytes INTEGER,
  notes           TEXT,
  uploaded_by     UUID REFERENCES users(id),
  doc_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

### 18. audit_log
```sql
CREATE TABLE audit_log (
  id          BIGSERIAL PRIMARY KEY,
  clinic_id   UUID,
  user_id     UUID,
  action      TEXT NOT NULL,     -- e.g. 'patient.update', 'invoice.delete'
  entity_type TEXT,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now()
);
-- audit_log is INSERT-ONLY via service role; no UPDATE/DELETE policy
```

---

### 19. blocked_slots
```sql
CREATE TABLE blocked_slots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id),
  doctor_id       UUID NOT NULL REFERENCES users(id),
  block_date      DATE NOT NULL,
  start_time      TIME,           -- null = full day
  end_time        TIME,
  reason          TEXT,
  is_recurring    BOOLEAN DEFAULT false,
  recur_day_of_week INTEGER,      -- 0=Sunday, 6=Saturday
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## Entity Relationship Summary

```
clinics
  └─── users (staff)
  └─── patients
         └─── case_history (1:1)
         └─── visits
                └─── vitals
                └─── prescriptions
                       └─── prescription_items
                └─── patient_diet_charts
                └─── patient_yoga_plans
                └─── patient_documents
         └─── invoices
                └─── invoice_items
                └─── payments
         └─── appointments
         └─── whatsapp_messages
  └─── leads
  └─── inventory
         └─── inventory_movements
  └─── expenses
  └─── diet_templates
  └─── yoga_asanas
  └─── blocked_slots
  └─── audit_log
```

---

## Supabase RLS Policies (key examples)

```sql
-- Patients: accessible only by staff of same clinic
CREATE POLICY "clinic_staff_access" ON patients
  FOR ALL USING (
    clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid())
  );

-- Finance tables: only admin and receptionist
CREATE POLICY "finance_access" ON invoices
  FOR ALL USING (
    clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('admin','receptionist')
  );

-- Audit log: insert only via service role
CREATE POLICY "audit_insert_only" ON audit_log
  FOR INSERT WITH CHECK (true);
-- No SELECT/UPDATE/DELETE policy = blocked for all client roles
```
