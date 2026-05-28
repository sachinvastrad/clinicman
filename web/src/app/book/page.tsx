"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check, Calendar, Clock, User, Phone, Mail } from "lucide-react";

// ─── Slot generation ────────────────────────────────────────────────────────
function generateSlots(): string[] {
  const slots: string[] = [];
  // 9:00 – 13:00
  for (let h = 9; h < 13; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  // 16:00 – 19:00
  for (let h = 16; h < 19; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

const ALL_SLOTS = generateSlots();

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

function getAvailableDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  let d = new Date(today);
  while (dates.length < 14) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day !== 0) { // Mon-Sat
      dates.push(d.toISOString().split("T")[0]);
    }
  }
  return dates;
}

const AVAILABLE_DATES = getAvailableDates();

// ─── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = ["Contact Info", "Date & Time", "Confirm"];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                done ? "bg-emerald-500 text-white" : active ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {done ? <Check className="w-4 h-4" /> : idx}
              </div>
              <span className={`mt-1.5 text-xs font-medium whitespace-nowrap ${active ? "text-indigo-600" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 h-0.5 mb-5 mx-1 ${done ? "bg-emerald-500" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ appointmentId: string; patientCode: string } | null>(null);

  // Step 1 validation
  const step1Valid = name.trim().length >= 2 && phone.trim().length >= 7;
  // Step 2 validation
  const step2Valid = !!date && !!time;

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/book/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, appointmentDate: date, appointmentTime: time }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setResult(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function buildGCalUrl() {
    const [y, mo, dy] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    const start = new Date(y, mo - 1, dy, h, mi);
    const end   = new Date(y, mo - 1, dy, h, mi + 30);
    const fmt = (d: Date) =>
      `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}00`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sachi+Homeopathic+Clinic+Appointment&dates=${fmt(start)}/${fmt(end)}&details=Appointment+at+Sachi+Homeopathic+Clinic`;
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-6">Your appointment has been successfully scheduled.</p>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 mb-6 text-sm">
            <Row label="Patient"    value={name} />
            <Row label="Patient ID" value={result.patientCode} />
            <Row label="Date"       value={new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })} />
            <Row label="Time"       value={formatTime(time)} />
            <Row label="Clinic"     value="Sachi Homeopathic Clinic" />
          </div>

          <a
            href={buildGCalUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 w-full justify-center px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors mb-3"
          >
            <Calendar className="w-4 h-4" /> Save to Google Calendar
          </a>
          <p className="text-xs text-gray-400">Please arrive 10 minutes before your appointment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Sachi Homeopathic Clinic" className="h-20 mx-auto mb-2 object-contain" />
          <p className="text-gray-500 text-sm mt-1">Book your appointment online</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <StepIndicator step={step} />

          {/* ── Step 1: Contact Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Contact Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="mt-2 w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Date & Time ── */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h2>

              {/* Date picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Choose a Date
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {AVAILABLE_DATES.map((d) => {
                    const dt = new Date(d + "T12:00:00");
                    return (
                      <button
                        key={d}
                        onClick={() => setDate(d)}
                        className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all text-center ${
                          date === d
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700"
                        }`}
                      >
                        <div className="font-semibold">{dt.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                        <div>{dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-500" /> Choose a Time Slot
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {ALL_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setTime(slot)}
                        className={`py-2.5 rounded-xl text-xs font-medium border transition-all ${
                          time === slot
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700"
                        }`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirm Your Appointment</h2>

              <div className="bg-indigo-50 rounded-xl p-5 space-y-3 text-sm">
                <Row label="Name"  value={name} />
                <Row label="Phone" value={phone} />
                {email && <Row label="Email" value={email} />}
                <div className="border-t border-indigo-100 pt-3">
                  <Row label="Date" value={new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"2-digit", month:"long", year:"numeric" })} />
                  <Row label="Time" value={formatTime(time)} />
                  <Row label="Clinic" value="Sachi Homeopathic Clinic" />
                  <Row label="Type"  value="Consultation" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-3 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Booking..." : <><Check className="w-4 h-4" /> Confirm Booking</>}
                </button>
              </div>

              <p className="text-xs text-center text-gray-400">
                By booking, you agree to our appointment policy. Our team will contact you to confirm.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sachi Homeopathic Clinic · sachihomeo.in
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 text-right">{value}</span>
    </div>
  );
}
