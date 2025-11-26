# Simple Supabase Test Script
Write-Host "Testing Supabase Configuration..." -ForegroundColor Cyan

# Test 1: Check environment variables
Write-Host "`n1. Environment Variables:" -ForegroundColor Yellow
$envContent = Get-Content .env.local
$supabaseUrl = ($envContent | Where-Object { $_ -match "VITE_SUPABASE_URL=" }) -replace "VITE_SUPABASE_URL=", ""
$anonKey = ($envContent | Where-Object { $_ -match "VITE_SUPABASE_ANON_KEY=" }) -replace "VITE_SUPABASE_ANON_KEY=", ""

if ($supabaseUrl) { Write-Host "   SUPABASE_URL: OK" -ForegroundColor Green }
else { Write-Host "   SUPABASE_URL: MISSING" -ForegroundColor Red }

if ($anonKey) { Write-Host "   ANON_KEY: OK" -ForegroundColor Green }
else { Write-Host "   ANON_KEY: MISSING" -ForegroundColor Red }

# Test 2: Server health
Write-Host "`n2. Server Health:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    Write-Host "   Server: RUNNING" -ForegroundColor Green
    Write-Host "   Storage: $($health.storage.status)" -ForegroundColor Cyan
} catch {
    Write-Host "   Server: NOT RESPONDING" -ForegroundColor Red
}

# Test 3: Authentication test
Write-Host "`n3. Authentication Test:" -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:5000/api/symptoms" -Method GET -Headers @{
        "Authorization" = "Bearer test"
    } -ErrorAction Stop | Out-Null
} catch {
    if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
        Write-Host "   Auth Middleware: WORKING (401 as expected)" -ForegroundColor Green
    } else {
        Write-Host "   Auth Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host "`nSupabase Dashboard: $supabaseUrl" -ForegroundColor Cyan
Write-Host "Next: Deploy database schema and enable RLS" -ForegroundColor Yellow
