#!/usr/bin/env bash
set -euo pipefail

BOLD="\033[1m"; GREEN="\033[0;32m"; YELLOW="\033[0;33m"; RED="\033[0;31m"; CYAN="\033[0;36m"; RESET="\033[0m"
step()  { echo -e "\n${BOLD}${CYAN}▶ $*${RESET}"; }
ok()    { echo -e "${GREEN}✔ $*${RESET}"; }
warn()  { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()   { echo -e "${RED}✖ $*${RESET}"; exit 1; }

WEB_DIR="$(cd "$(dirname "$0")/web" && pwd)"

echo -e "\n${BOLD}DrMan.ai — Network Fix & Install${RESET}\n"

# ── Show current proxy config ───────────────────────────────────────
step "Current pnpm proxy settings"
echo "  proxy      : $(pnpm config get proxy 2>/dev/null || echo 'not set')"
echo "  https-proxy: $(pnpm config get https-proxy 2>/dev/null || echo 'not set')"
echo "  registry   : $(pnpm config get registry 2>/dev/null || echo 'not set')"

# ── Strategy 1: Clear proxy, use direct connection ──────────────────
step "Strategy 1 — clearing corporate proxy from pnpm config"
pnpm config delete proxy       2>/dev/null || true
pnpm config delete https-proxy 2>/dev/null || true
pnpm config delete http-proxy  2>/dev/null || true

# Also unset env-level proxy variables for this session
unset http_proxy HTTP_PROXY https_proxy HTTPS_PROXY no_proxy NO_PROXY 2>/dev/null || true

# Test direct connection to npmjs
echo -e "  Testing direct connection to registry.npmjs.org..."
if curl -sf --max-time 5 "https://registry.npmjs.org/next/latest" -o /dev/null 2>&1; then
  ok "Direct connection works! Installing..."
  cd "$WEB_DIR"
  pnpm install && ok "Install complete!" && exec bash "$(dirname "$0")/setup.sh"
fi
warn "Direct connection failed — trying mirrors"

# ── Strategy 2: Cloudflare npm mirror ──────────────────────────────
step "Strategy 2 — using Cloudflare npm proxy (1.1.1.1)"
echo -e "  Testing https://registry.npmjs.cf..."
if curl -sf --max-time 5 "https://registry.npmjs.cf/next/latest" -o /dev/null 2>&1; then
  pnpm config set registry "https://registry.npmjs.cf"
  cd "$WEB_DIR"
  if pnpm install 2>&1; then
    ok "Install complete via Cloudflare mirror!"
    pnpm config delete registry  # restore default
    exec bash "$(dirname "$0")/setup.sh"
  fi
fi
pnpm config delete registry 2>/dev/null || true
warn "Cloudflare mirror failed"

# ── Strategy 3: npmmirror (Chinese mirror, globally available) ─────
step "Strategy 3 — using npmmirror.com (global CDN)"
echo -e "  Testing https://registry.npmmirror.com..."
if curl -sf --max-time 8 "https://registry.npmmirror.com/next/latest" -o /dev/null 2>&1; then
  pnpm config set registry "https://registry.npmmirror.com"
  cd "$WEB_DIR"
  if pnpm install 2>&1; then
    ok "Install complete via npmmirror.com!"
    pnpm config delete registry
    exec bash "$(dirname "$0")/setup.sh"
  fi
fi
pnpm config delete registry 2>/dev/null || true
warn "npmmirror failed"

# ── Strategy 4: Check internal Walmart Artifactory ─────────────────
step "Strategy 4 — checking for internal Walmart npm registry"
INTERNAL_CANDIDATES=(
  "https://npm.walmart.com"
  "https://artifactory.walmart.com/artifactory/api/npm/npm-remote"
  "https://registry.npmjs.walmart.com"
  "https://nexus.walmart.com/repository/npm-proxy"
)
for REG in "${INTERNAL_CANDIDATES[@]}"; do
  echo -e "  Trying $REG..."
  if curl -sf --max-time 5 "$REG/next/latest" -o /dev/null 2>&1; then
    ok "Internal registry found: $REG"
    pnpm config set registry "$REG"
    cd "$WEB_DIR"
    if pnpm install 2>&1; then
      ok "Install complete via internal registry!"
      exec bash "$(dirname "$0")/setup.sh"
    fi
    pnpm config delete registry 2>/dev/null || true
  fi
done
warn "No internal registry found"

# ── All strategies failed ──────────────────────────────────────────
echo
echo -e "${BOLD}${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Could not reach any npm registry from this network.${RESET}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
echo "  Options:"
echo
echo "  A) Connect your phone as a WiFi hotspot, then run:"
echo "     bash fix-proxy.sh"
echo
echo "  B) Ask your IT team for the internal npm/Artifactory registry URL,"
echo "     then run:"
echo "     pnpm config set registry <internal-url>"
echo "     pnpm install"
echo
echo "  C) Run the install from home / any unrestricted network,"
echo "     then copy the entire project folder (including node_modules) back here."
echo "     The app will run without needing internet after that."
echo
echo "  D) If you have VPN access to a non-Walmart network, connect it first."
echo
echo "  Your current .npmrc settings have been reset (proxy cleared)."
echo "  When you have internet access, just run:  bash setup.sh"
