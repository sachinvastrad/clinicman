-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "gstin" TEXT,
    "logo_url" TEXT,
    "whatsapp_number" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "avatar_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "patient_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "date_of_birth" DATETIME,
    "gender" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "occupation" TEXT,
    "referred_by" TEXT,
    "photo_url" TEXT,
    "whatsapp_optin" BOOLEAN NOT NULL DEFAULT true,
    "allergies" TEXT,
    "case_type" TEXT,
    "registered_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "patients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "case_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "hopi" TEXT,
    "past_history" TEXT,
    "family_history" TEXT,
    "personal_history" TEXT,
    "mental_generals" TEXT,
    "physical_generals" TEXT,
    "pqrs_symptoms" TEXT,
    "constitution_type" TEXT,
    "thermal_state" TEXT,
    "mental_disposition" TEXT,
    "miasmatic_notes" TEXT,
    "dominant_miasm" TEXT,
    "repertorization_notes" TEXT,
    "selected_remedy" TEXT,
    "potency" TEXT,
    "clinical_diagnosis" TEXT,
    "differential_diagnosis" TEXT,
    "investigations" TEXT,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "case_history_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "visit_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visit_type" TEXT,
    "chief_complaint" TEXT,
    "clinical_findings" TEXT,
    "diagnosis" TEXT,
    "plan_of_action" TEXT,
    "improvement_score" INTEGER,
    "follow_up_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "visits_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "visits_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "visits_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vitals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visit_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "bp" TEXT,
    "pulse" INTEGER,
    "temperature" DECIMAL,
    "weight" DECIMAL,
    "height" DECIMAL,
    "spo2" INTEGER,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vitals_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visit_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "dietary_notes" TEXT,
    "follow_up_date" DATETIME,
    "pdf_url" TEXT,
    "whatsapp_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prescriptions_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prescription_id" TEXT NOT NULL,
    "remedy_name" TEXT NOT NULL,
    "potency" TEXT NOT NULL,
    "form" TEXT,
    "dose" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "scheduled_at" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "appointment_type" TEXT NOT NULL DEFAULT 'consultation',
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "potency" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 5,
    "cost_price" DECIMAL,
    "selling_price" DECIMAL,
    "vendor_id" TEXT,
    "expiry_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inventory_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "inventory_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventory_id" TEXT NOT NULL,
    "movement_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reference_id" TEXT,
    "notes" TEXT,
    "performed_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "invoice_number" TEXT NOT NULL,
    "subtotal_amount" DECIMAL NOT NULL,
    "discount_amount" DECIMAL NOT NULL DEFAULT 0,
    "total_amount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "pdf_url" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL NOT NULL,
    "total_price" DECIMAL NOT NULL,
    CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "paid_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference_no" TEXT,
    "received_by" TEXT,
    CONSTRAINT "payments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "interested_in" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "assigned_to" TEXT,
    "follow_up_date" DATETIME,
    "notes" TEXT,
    "patient_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leads_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "leads_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "category" TEXT NOT NULL,
    "expense_date" DATETIME NOT NULL,
    "notes" TEXT,
    "receipt_url" TEXT,
    "recorded_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "expenses_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patient_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patient_id" TEXT NOT NULL,
    "visit_id" TEXT,
    "doc_type" TEXT,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size_bytes" INTEGER,
    "notes" TEXT,
    "uploaded_by" TEXT,
    "doc_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "patient_documents_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patient_documents_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blocked_slots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "block_date" DATETIME NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "reason" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recur_day_of_week" INTEGER,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocked_slots_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "direction" TEXT NOT NULL,
    "template_name" TEXT,
    "message_body" TEXT,
    "media_url" TEXT,
    "wati_message_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sent_by" TEXT,
    "delivered_at" DATETIME,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_messages_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "whatsapp_messages_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "whatsapp_messages_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clinic_id" TEXT,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "old_data" TEXT,
    "new_data" TEXT,
    "ip_address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "diet_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "diet_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patient_diet_charts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visit_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "diet_template_id" TEXT,
    "custom_content" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "patient_diet_charts_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patient_diet_charts_diet_template_id_fkey" FOREIGN KEY ("diet_template_id") REFERENCES "diet_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "yoga_asanas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sanskrit_name" TEXT,
    "category" TEXT,
    "description" TEXT,
    "duration" TEXT,
    "benefits" TEXT,
    "contraindications" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "yoga_asanas_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patient_yoga_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visit_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "patient_yoga_plans_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patient_yoga_plan_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "yoga_plan_id" TEXT NOT NULL,
    "yoga_asana_id" TEXT NOT NULL,
    "duration" TEXT,
    "repetitions" TEXT,
    "instructions" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "patient_yoga_plan_items_yoga_plan_id_fkey" FOREIGN KEY ("yoga_plan_id") REFERENCES "patient_yoga_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "patient_yoga_plan_items_yoga_asana_id_fkey" FOREIGN KEY ("yoga_asana_id") REFERENCES "yoga_asanas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disease_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosis" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "disease_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disease_template_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disease_template_id" TEXT NOT NULL,
    "remedy_name" TEXT NOT NULL,
    "potency" TEXT NOT NULL,
    "form" TEXT,
    "dose" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "disease_template_items_disease_template_id_fkey" FOREIGN KEY ("disease_template_id") REFERENCES "disease_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vendors_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_ins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "invoice_no" TEXT,
    "purchase_date" DATETIME NOT NULL,
    "total_amount" DECIMAL,
    "notes" TEXT,
    "recorded_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_ins_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "stock_ins_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_in_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stock_in_id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost_price" DECIMAL NOT NULL,
    "total_price" DECIMAL NOT NULL,
    CONSTRAINT "stock_in_items_stock_in_id_fkey" FOREIGN KEY ("stock_in_id") REFERENCES "stock_ins" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stock_in_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "inventory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "treatment_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "session_count" INTEGER NOT NULL,
    "validity_days" INTEGER,
    "price" DECIMAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "treatment_packages_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patient_package_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "treatment_package_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "sessions_total" INTEGER NOT NULL,
    "sessions_used" INTEGER NOT NULL DEFAULT 0,
    "start_date" DATETIME NOT NULL,
    "expiry_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "patient_package_enrollments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patient_package_enrollments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "patient_package_enrollments_treatment_package_id_fkey" FOREIGN KEY ("treatment_package_id") REFERENCES "treatment_packages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_clinic_id_idx" ON "users"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patient_code_key" ON "patients"("patient_code");

-- CreateIndex
CREATE INDEX "patients_clinic_id_idx" ON "patients"("clinic_id");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "case_history_patient_id_key" ON "case_history"("patient_id");

-- CreateIndex
CREATE INDEX "visits_patient_id_idx" ON "visits"("patient_id");

-- CreateIndex
CREATE INDEX "visits_doctor_id_idx" ON "visits"("doctor_id");

-- CreateIndex
CREATE INDEX "visits_visit_date_idx" ON "visits"("visit_date");

-- CreateIndex
CREATE UNIQUE INDEX "vitals_visit_id_key" ON "vitals"("visit_id");

-- CreateIndex
CREATE INDEX "vitals_patient_id_idx" ON "vitals"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_visit_id_key" ON "prescriptions"("visit_id");

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_idx" ON "prescriptions"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_scheduled_at_clinic_id_idx" ON "appointments"("scheduled_at", "clinic_id");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "inventory_clinic_id_idx" ON "inventory"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_patient_id_idx" ON "invoices"("patient_id");

-- CreateIndex
CREATE INDEX "invoices_clinic_id_idx" ON "invoices"("clinic_id");

-- CreateIndex
CREATE INDEX "payments_clinic_id_idx" ON "payments"("clinic_id");

-- CreateIndex
CREATE INDEX "leads_clinic_id_idx" ON "leads"("clinic_id");

-- CreateIndex
CREATE INDEX "expenses_clinic_id_idx" ON "expenses"("clinic_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_patient_id_idx" ON "whatsapp_messages"("patient_id");

-- CreateIndex
CREATE INDEX "diet_templates_clinic_id_idx" ON "diet_templates"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_diet_charts_visit_id_key" ON "patient_diet_charts"("visit_id");

-- CreateIndex
CREATE INDEX "patient_diet_charts_patient_id_idx" ON "patient_diet_charts"("patient_id");

-- CreateIndex
CREATE INDEX "patient_diet_charts_clinic_id_idx" ON "patient_diet_charts"("clinic_id");

-- CreateIndex
CREATE INDEX "yoga_asanas_clinic_id_idx" ON "yoga_asanas"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_yoga_plans_visit_id_key" ON "patient_yoga_plans"("visit_id");

-- CreateIndex
CREATE INDEX "patient_yoga_plans_patient_id_idx" ON "patient_yoga_plans"("patient_id");

-- CreateIndex
CREATE INDEX "patient_yoga_plans_clinic_id_idx" ON "patient_yoga_plans"("clinic_id");

-- CreateIndex
CREATE INDEX "disease_templates_clinic_id_idx" ON "disease_templates"("clinic_id");

-- CreateIndex
CREATE INDEX "vendors_clinic_id_idx" ON "vendors"("clinic_id");

-- CreateIndex
CREATE INDEX "stock_ins_clinic_id_idx" ON "stock_ins"("clinic_id");

-- CreateIndex
CREATE INDEX "treatment_packages_clinic_id_idx" ON "treatment_packages"("clinic_id");

-- CreateIndex
CREATE INDEX "patient_package_enrollments_patient_id_idx" ON "patient_package_enrollments"("patient_id");

-- CreateIndex
CREATE INDEX "patient_package_enrollments_clinic_id_idx" ON "patient_package_enrollments"("clinic_id");
