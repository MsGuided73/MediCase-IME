# Test Supabase Authentication and Database Connection
# Run this script to verify your Supabase setup

Write-Host "🧪 Testing Supabase Configuration..." -ForegroundColor Cyan

# Test 1: Environment Variables
Write-Host "`n1. Checking Environment Variables..." -ForegroundColor Yellow
$envFile = ".env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $supabaseUrl = ($envContent | Where-Object { $_ -match "VITE_SUPABASE_URL=" }) -replace "VITE_SUPABASE_URL=", ""
    $anonKey = ($envContent | Where-Object { $_ -match "VITE_SUPABASE_ANON_KEY=" }) -replace "VITE_SUPABASE_ANON_KEY=", ""
    $serviceKey = ($envContent | Where-Object { $_ -match "SUPABASE_SERVICE_ROLE_KEY=" }) -replace "SUPABASE_SERVICE_ROLE_KEY=", ""
    
    if ($supabaseUrl) { Write-Host "   ✅ VITE_SUPABASE_URL configured" -ForegroundColor Green }
    else { Write-Host "   ❌ VITE_SUPABASE_URL missing" -ForegroundColor Red }
    
    if ($anonKey) { Write-Host "   ✅ VITE_SUPABASE_ANON_KEY configured" -ForegroundColor Green }
    else { Write-Host "   ❌ VITE_SUPABASE_ANON_KEY missing" -ForegroundColor Red }
    
    if ($serviceKey) { Write-Host "   ✅ SUPABASE_SERVICE_ROLE_KEY configured" -ForegroundColor Green }
    else { Write-Host "   ❌ SUPABASE_SERVICE_ROLE_KEY missing" -ForegroundColor Red }
} else {
    Write-Host "   ❌ .env.local file not found" -ForegroundColor Red
}

# Test 2: Server Health
Write-Host "`n2. Testing Server Health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Server is running" -ForegroundColor Green
    Write-Host "   📊 Storage Status: $($healthResponse.storage.status)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Supabase Connection
Write-Host "`n3. Testing Supabase Connection..." -ForegroundColor Yellow
if ($supabaseUrl) {
    try {
        $supabaseHealth = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/" -Headers @{
            "apikey" = $anonKey
            "Authorization" = "Bearer $anonKey"
        } -TimeoutSec 10
        Write-Host "   ✅ Supabase API accessible" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Supabase connection failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Check your SUPABASE_URL and API keys" -ForegroundColor Yellow
    }
}

# Test 4: Authentication Endpoint
Write-Host "`n4. Testing Authentication..." -ForegroundColor Yellow
try {
    $authTest = Invoke-WebRequest -Uri "http://localhost:5000/api/symptoms" -Method GET -Headers @{
        "Authorization" = "Bearer invalid-token"
    } -ErrorAction SilentlyContinue
} catch {
    if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
        Write-Host "   ✅ Authentication middleware working (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. If any tests failed, check your Supabase dashboard settings" -ForegroundColor White
Write-Host "2. Ensure Row Level Security is enabled on all tables" -ForegroundColor White
Write-Host "3. Deploy database schema using the SQL migration scripts" -ForegroundColor White
Write-Host "4. Set Site URL to http://localhost:5173 in Supabase Auth settings" -ForegroundColor White
Write-Host "5. Try creating a test user account in the application" -ForegroundColor White

Write-Host "`nSupabase Dashboard: $supabaseUrl" -ForegroundColor Cyan
