# DrMan.ai — WhatsApp Business API Integration

**Version:** 1.0 | **Date:** 2026-05-16  
**BSP (Business Solution Provider):** WATI (wati.io) — recommended for India  
**Fallback BSP:** AiSensy / Interakt

---

## 1. Setup Checklist

- [ ] Register a dedicated WhatsApp Business number (separate from personal/reception phone)
- [ ] Create a Meta Business account at business.facebook.com
- [ ] Connect the number to WATI dashboard
- [ ] Complete KYC and business verification on Meta Business Manager
- [ ] Get a display name approved (e.g., "DrMan Clinic")
- [ ] Create and submit all message templates for Meta approval (24–48 hrs)
- [ ] Configure webhook URL in WATI: `https://your-domain.com/api/whatsapp/webhook`
- [ ] Add `WATI_API_ENDPOINT` and `WATI_API_TOKEN` to environment variables
- [ ] Generate and store `WHATSAPP_WEBHOOK_SECRET` for HMAC verification

---

## 2. Message Templates

All outbound messages outside a 24-hour customer service window must use Meta-approved templates.

### Template 1: `appointment_confirmation`
**Category:** UTILITY  
**Language:** en  
```
Hello {{1}},

Your appointment at *{{2}}* is confirmed ✓

📅 Date: {{3}}
🕐 Time: {{4}}
👨‍⚕️ Doctor: {{5}}

📍 {{6}}

Reply *CANCEL* to cancel your appointment.
See you soon!
```
**Variables:** name, clinic_name, date, time, doctor_name, clinic_address

---

### Template 2: `appointment_reminder_24h`
**Category:** UTILITY  
```
Hi {{1}}, a friendly reminder 🔔

Your appointment at *{{2}}* is *tomorrow*.

📅 {{3}} at {{4}}
👨‍⚕️ Dr. {{5}}

_Please arrive 5 minutes early._
```
**Variables:** name, clinic_name, date, time, doctor_name

---

### Template 3: `prescription_dispatch`
**Category:** UTILITY  
```
Dear {{1}},

Your prescription from *Dr. {{2}}* dated {{3}} is attached.

💊 Please follow the dosage instructions carefully.
📅 Next follow-up: {{4}}

_{{5}}_

— {{6}} Clinic
```
**Variables:** patient_name, doctor_name, date, followup_date, dietary_note, clinic_name  
**Media:** Document (PDF)

---

### Template 4: `followup_reminder`
**Category:** UTILITY  
```
Hi {{1}},

Dr. {{2}} has recommended a follow-up by *{{3}}*.

Don't delay your health! 🌿

Book your appointment here:
{{4}}

— {{5}} Clinic
```
**Variables:** name, doctor_name, followup_date, booking_link, clinic_name

---

### Template 5: `receipt_dispatch`
**Category:** UTILITY  
```
Dear {{1}},

Thank you for visiting *{{2}}*! 🙏

Receipt No: {{3}}
Date: {{4}}
Amount Paid: ₹{{5}}

Your invoice is attached for your records.

Take care & stay healthy!
```
**Variables:** patient_name, clinic_name, invoice_number, date, amount  
**Media:** Document (PDF)

---

### Template 6: `wellness_plan`
**Category:** UTILITY  
```
Hi {{1}},

Your personalised *Wellness Plan* from Dr. {{2}} is ready! 🌱

It includes:
🥗 Diet Chart
🧘 Yoga Asanas

Please follow it along with your medication for best results.
```
**Variables:** name, doctor_name  
**Media:** Document (PDF)

---

### Template 7: `you_are_next`
**Category:** UTILITY  
```
Hi {{1}},

You're *next in line* at {{2}}! 🔔

Please make your way to the reception.

Token No: *{{3}}*
```
**Variables:** name, clinic_name, token_number

---

### Template 8: `health_tip_broadcast`
**Category:** MARKETING  
```
🌿 *Health Tip from {{1}}*

{{2}}

_Stay healthy, stay happy!_
— Dr. {{3}}
```
**Variables:** clinic_name, tip_text, doctor_name

---

## 3. WATI API Wrapper

```typescript
// lib/whatsapp/wati.ts

const BASE_URL = process.env.WATI_API_ENDPOINT!
const TOKEN    = process.env.WATI_API_TOKEN!

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

export async function sendTemplate(
  phone: string,
  templateName: string,
  params: string[],
  mediaUrl?: string
) {
  const body: Record<string, unknown> = {
    template_name: templateName,
    broadcast_name: `drman_${templateName}_${Date.now()}`,
    receivers: [
      {
        whatsappNumber: phone.replace('+', ''),
        customParams: params.map((value, i) => ({
          name: String(i + 1),
          value,
        })),
      },
    ],
  }

  if (mediaUrl) {
    body.media = { type: 'document', url: mediaUrl }
  }

  const res = await fetch(`${BASE_URL}/api/v1/sendTemplateMessages`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`WATI error: ${JSON.stringify(err)}`)
  }

  return res.json() as Promise<{ messageId: string }>
}

export async function sendTextReply(phone: string, message: string) {
  const res = await fetch(
    `${BASE_URL}/api/v1/sendSessionMessage/${phone.replace('+', '')}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ messageText: message }),
    }
  )
  if (!res.ok) throw new Error('WATI session reply failed')
  return res.json()
}
```

---

## 4. Webhook Handler

```typescript
// app/api/whatsapp/webhook/route.ts
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  // 1. Verify HMAC signature
  const signature = req.headers.get('x-wati-signature') ?? ''
  const body      = await req.text()
  const expected  = crypto
    .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expected) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  // 2. Handle inbound message
  if (payload.type === 'message') {
    const { waId, text, messageId, timestamp } = payload

    // Find patient by phone
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id, clinic_id')
      .eq('phone', `+${waId}`)
      .single()

    // Persist message
    await supabaseAdmin.from('whatsapp_messages').insert({
      clinic_id:      patient?.clinic_id,
      patient_id:     patient?.id,
      direction:      'inbound',
      message_body:   text?.body ?? '',
      wati_message_id: messageId,
    })

    // Handle CANCEL keyword
    if (text?.body?.trim().toUpperCase() === 'CANCEL') {
      // trigger appointment cancellation flow
    }
  }

  // 3. Handle delivery status update
  if (payload.type === 'status') {
    const { messageId, status } = payload
    await supabaseAdmin
      .from('whatsapp_messages')
      .update({
        status,
        ...(status === 'delivered' ? { delivered_at: new Date() } : {}),
        ...(status === 'read'      ? { read_at:      new Date() } : {}),
      })
      .eq('wati_message_id', messageId)
  }

  return Response.json({ ok: true })
}
```

---

## 5. Background Job — Appointment Reminders

```typescript
// jobs/send-appointment-reminders.ts
// Runs every 30 minutes via Vercel Cron: { "crons": [{ "path": "/api/jobs/reminders", "schedule": "*/30 * * * *" }] }

import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendTemplate }  from '@/lib/whatsapp/wati'
import { format, addHours } from 'date-fns'

export async function sendAppointmentReminders() {
  const now      = new Date()
  const from     = addHours(now, 24)
  const to       = addHours(now, 25)

  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select('id, patient:patients(full_name, phone), appointment_date, start_time, doctor:users(full_name), clinic:clinics(name, address)')
    .eq('status', 'confirmed')
    .eq('reminder_sent', false)
    .gte('appointment_date', format(from, 'yyyy-MM-dd'))
    .lte('appointment_date', format(to,   'yyyy-MM-dd'))

  for (const appt of appointments ?? []) {
    const patient = appt.patient as { full_name: string; phone: string }
    try {
      await sendTemplate(patient.phone, 'appointment_reminder_24h', [
        patient.full_name,
        (appt.clinic as { name: string }).name,
        appt.appointment_date,
        appt.start_time,
        (appt.doctor as { full_name: string }).full_name,
      ])

      await supabaseAdmin
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', appt.id)
    } catch (err) {
      console.error(`Reminder failed for appt ${appt.id}:`, err)
    }
  }
}
```

---

## 6. Opt-In / Opt-Out Compliance (DPDP Act)

- Opt-in captured at patient registration (checkbox with explicit consent text)
- Opt-out: patient replies STOP → webhook sets `whatsapp_optin = false` on patients table
- All template sends check `whatsapp_optin = true` before dispatching
- Opt-out is processed within 24 hours per DPDP requirements
- Opt-in/out events logged in `audit_log`

---

## 7. Rate Limits & Quotas

| Tier | Messages/day | Notes |
|------|-------------|-------|
| New BSP account | 250 | Per unique users per 24 hrs |
| Verified (tier 1) | 1,000 | After first 1,000 conversations |
| Tier 2 | 10,000 | Automatic upgrade |
| Tier 3 | 100,000 | — |

Implement a job queue (BullMQ or Supabase pg_cron) to space out broadcasts and avoid hitting rate limits.
