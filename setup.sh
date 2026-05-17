#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────
#  DrMan.ai — One-shot setup & dev server launcher
#  Run from any network that can reach registry.npmjs.org
#  Usage:  bash setup.sh
# ─────────────────────────────────────────────────────────────────

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

WEB_DIR="$(cd "$(dirname "$0")/web" && pwd)"

step()  { echo -e "\n${BOLD}${CYAN}▶ $*${RESET}"; }
ok()    { echo -e "${GREEN}✔ $*${RESET}"; }
warn()  { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()   { echo -e "${RED}✖ $*${RESET}"; exit 1; }
ask()   { local __var=$1 __prompt=$2; read -rp "  $__prompt: " "$__var"; }
askq()  { local __var=$1 __prompt=$2; read -rsp "  $__prompt: " "$__var"; echo; }

# ── Banner ─────────────────────────────────────────────────────────
echo -e "\n${BOLD}╔══════════════════════════════════════╗"
echo -e "║   DrMan.ai — Setup Script v1.0       ║"
echo -e "╚══════════════════════════════════════╝${RESET}\n"

# ── 1. Node.js ─────────────────────────────────────────────────────
step "Checking Node.js"
if ! command -v node &>/dev/null; then
  die "Node.js not found. Install Node 18+ from https://nodejs.org and re-run."
fi
NODE_VER=$(node -v)
ok "Node.js $NODE_VER"

# ── 2. pnpm ────────────────────────────────────────────────────────
step "Checking pnpm"
if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found — installing via npm..."
  npm install -g pnpm || die "Failed to install pnpm. Try: sudo npm install -g pnpm"
fi
ok "pnpm $(pnpm -v)"

# ── 3. .env.local ─────────────────────────────────────────────────
step "Environment configuration"
ENV_FILE="$WEB_DIR/.env.local"

if [[ -f "$ENV_FILE" ]] && grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" "$ENV_FILE" 2>/dev/null; then
  ok ".env.local already configured — skipping"
else
  echo -e "\n  ${BOLD}You need a Supabase project.${RESET}"
  echo "  Create one free at: https://supabase.com/dashboard"
  echo "  Then go to: Project Settings → API\n"

  ask SUPA_URL      "Supabase Project URL (https://xxxx.supabase.co)"
  ask SUPA_ANON     "Supabase Anon/Public Key"
  askq SUPA_SERVICE "Supabase Service Role Key (secret)"
  ask DATABASE_URL  "Postgres Connection String (from Supabase → Settings → Database → Connection string → URI)"
  ask APP_URL       "App URL for local dev (press Enter for http://localhost:3000)"
  APP_URL="${APP_URL:-http://localhost:3000}"

  cat > "$ENV_FILE" <<EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=${SUPA_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPA_ANON}
SUPABASE_SERVICE_ROLE_KEY=${SUPA_SERVICE}

# Database (Prisma)
DATABASE_URL=${DATABASE_URL}

# App
NEXT_PUBLIC_APP_URL=${APP_URL}

# WhatsApp / WATI  (fill in later)
WATI_API_ENDPOINT=
WATI_API_TOKEN=
WATI_WEBHOOK_SECRET=

# Razorpay  (fill in later)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# Feature flags
NEXT_PUBLIC_ENABLE_WHATSAPP=false
NEXT_PUBLIC_ENABLE_RAZORPAY=false
EOF
  ok ".env.local written"
fi

# ── 4. Install dependencies ────────────────────────────────────────
step "Installing npm dependencies"
cd "$WEB_DIR"
pnpm install || die "pnpm install failed. Check network access to registry.npmjs.org"
ok "Dependencies installed"

# ── 5. Prisma generate ────────────────────────────────────────────
step "Generating Prisma client"
pnpm exec prisma generate || die "prisma generate failed"
ok "Prisma client generated"

# ── 6. Database migration ─────────────────────────────────────────
step "Running database migrations"
echo -e "  ${YELLOW}This creates all tables in your Supabase database.${RESET}"

if pnpm exec prisma migrate deploy 2>/dev/null; then
  ok "Migrations applied (prisma migrate deploy)"
else
  warn "migrate deploy failed — trying migrate dev (for new projects)..."
  pnpm exec prisma migrate dev --name init || die "Database migration failed. Check your DATABASE_URL in .env.local"
  ok "Database initialized with 'init' migration"
fi

# ── 7. Seed (optional) ────────────────────────────────────────────
step "Database seed (optional)"
echo -e "  Seed creates a demo clinic record."
read -rp "  Run seed? [y/N]: " RUN_SEED
if [[ "$RUN_SEED" =~ ^[Yy]$ ]]; then
  pnpm exec tsx prisma/seed.ts && ok "Seed complete" || warn "Seed failed (non-critical)"
else
  warn "Skipped seed"
fi

# ── 8. First admin user reminder ─────────────────────────────────
echo -e "\n${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Action required: Create your first admin user${RESET}\n"
echo "  1. Go to your Supabase Dashboard → Authentication → Users"
echo "  2. Click 'Add user' → set phone (e.g. +919999999999) and confirm"
echo "  3. Copy the UUID of the new auth user"
echo "  4. Run this SQL in Supabase SQL Editor (replace values):"
echo
echo "     INSERT INTO users (id, clinic_id, full_name, phone, role, is_active)"
echo "     VALUES ("
echo "       '<auth-user-uuid>',"
echo "       '00000000-0000-0000-0000-000000000001',"
echo "       'Admin User',"
echo "       '+919999999999',"
echo "       'admin',"
echo "       true"
echo "     );"
echo
echo "  5. Log in at http://localhost:3000/login with that phone + OTP"
echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"

# ── 9. Start dev server ───────────────────────────────────────────
step "Starting Next.js dev server"
ok "App will be available at: http://localhost:3000"
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop\n"
pnpm dev
