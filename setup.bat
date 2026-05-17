@echo off
setlocal enabledelayedexpansion
title DrMan.ai Setup

echo.
echo ==========================================
echo   DrMan.ai -- Setup Script (Windows)
echo ==========================================
echo.

:: ── Check Node.js ─────────────────────────────────────────────────
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo         Download from: https://nodejs.org  (choose LTS)
    pause & exit /b 1
)
echo [OK] Node.js found:
node -v

:: ── Check pnpm ────────────────────────────────────────────────────
pnpm -v >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing pnpm...
    npm install -g pnpm
    if errorlevel 1 (
        echo [ERROR] Failed to install pnpm.
        pause & exit /b 1
    )
)
echo [OK] pnpm found:
pnpm -v

:: ── Navigate to web folder ────────────────────────────────────────
set "SCRIPT_DIR=%~dp0"
set "WEB_DIR=%SCRIPT_DIR%web"

if not exist "%WEB_DIR%" (
    echo [ERROR] web folder not found at: %WEB_DIR%
    pause & exit /b 1
)
cd /d "%WEB_DIR%"
echo [OK] Working directory: %WEB_DIR%

:: ── .env.local setup ─────────────────────────────────────────────
if exist ".env.local" (
    findstr /c:"NEXT_PUBLIC_SUPABASE_URL=https://" .env.local >nul 2>&1
    if not errorlevel 1 (
        echo [OK] .env.local already configured -- skipping
        goto :install
    )
)

echo.
echo ==========================================
echo   Environment Setup
echo   You need a free Supabase project at:
echo   https://supabase.com/dashboard
echo   Go to: Project Settings ^> API
echo ==========================================
echo.

set /p SUPA_URL="  Supabase Project URL (https://xxxx.supabase.co): "
set /p SUPA_ANON="  Supabase Anon/Public Key: "
set /p SUPA_SERVICE="  Supabase Service Role Key (secret): "
set /p DATABASE_URL="  Postgres Connection String (from Supabase > Settings > Database > URI): "
set /p APP_URL="  App URL (press Enter for http://localhost:3000): "
if "!APP_URL!"=="" set "APP_URL=http://localhost:3000"

(
echo # Supabase
echo NEXT_PUBLIC_SUPABASE_URL=!SUPA_URL!
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=!SUPA_ANON!
echo SUPABASE_SERVICE_ROLE_KEY=!SUPA_SERVICE!
echo.
echo # Database ^(Prisma^)
echo DATABASE_URL=!DATABASE_URL!
echo.
echo # App
echo NEXT_PUBLIC_APP_URL=!APP_URL!
echo.
echo # WhatsApp / WATI  ^(fill in later^)
echo WATI_API_ENDPOINT=
echo WATI_API_TOKEN=
echo WATI_WEBHOOK_SECRET=
echo.
echo # Razorpay  ^(fill in later^)
echo RAZORPAY_KEY_ID=
echo RAZORPAY_KEY_SECRET=
echo NEXT_PUBLIC_RAZORPAY_KEY_ID=
echo.
echo # Feature flags
echo NEXT_PUBLIC_ENABLE_WHATSAPP=false
echo NEXT_PUBLIC_ENABLE_RAZORPAY=false
) > .env.local
echo [OK] .env.local written

:install
:: ── Install dependencies ──────────────────────────────────────────
echo.
echo [INFO] Installing npm dependencies...
echo        (This may take 3-5 minutes on first run)
echo.
pnpm install
if errorlevel 1 (
    echo.
    echo [ERROR] pnpm install failed.
    echo         If you see ENOTFOUND errors, your network blocks npmjs.org.
    echo         Solutions:
    echo           1. Use your phone as a WiFi hotspot
    echo           2. Run this from home and copy node_modules back
    pause & exit /b 1
)
echo [OK] Dependencies installed

:: ── Prisma generate ───────────────────────────────────────────────
echo.
echo [INFO] Generating Prisma client...
pnpm exec prisma generate
if errorlevel 1 (
    echo [ERROR] Prisma generate failed
    pause & exit /b 1
)
echo [OK] Prisma client generated

:: ── Database migration ────────────────────────────────────────────
echo.
echo [INFO] Running database migrations...
pnpm exec prisma migrate deploy 2>nul
if errorlevel 1 (
    echo [INFO] Trying migrate dev (first time setup)...
    pnpm exec prisma migrate dev --name init
    if errorlevel 1 (
        echo [ERROR] Database migration failed. Check DATABASE_URL in .env.local
        pause & exit /b 1
    )
)
echo [OK] Database migrations applied

:: ── First admin user reminder ─────────────────────────────────────
echo.
echo ==========================================
echo   ACTION REQUIRED: Create first admin user
echo ==========================================
echo.
echo   1. Go to Supabase Dashboard ^> Authentication ^> Users
echo   2. Click "Add user" -- set phone e.g. +919999999999
echo   3. Copy the UUID of the new auth user
echo   4. Run this SQL in Supabase SQL Editor:
echo.
echo      INSERT INTO users (id, clinic_id, full_name, phone, role, is_active)
echo      VALUES (
echo        '^<auth-user-uuid^>',
echo        '00000000-0000-0000-0000-000000000001',
echo        'Admin User',
echo        '+919999999999',
echo        'admin',
echo        true
echo      );
echo.
echo   5. Log in at http://localhost:3000/login
echo ==========================================
echo.

:: ── Start dev server ──────────────────────────────────────────────
echo [INFO] Starting Next.js dev server...
echo        Open your browser at: http://localhost:3000
echo        Press Ctrl+C to stop
echo.
pnpm dev
