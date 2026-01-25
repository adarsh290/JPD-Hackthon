# Smart Link Hub Backend Setup Script (PowerShell)

Write-Host "🚀 Setting up Smart Link Hub Backend..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env and set your DATABASE_URL and JWT_SECRET" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path node_modules)) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
}

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
npm run prisma:generate

# Check if database is accessible
Write-Host "🔍 Checking database connection..." -ForegroundColor Cyan
$dbCheck = npx prisma db pull 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection failed. Please check your DATABASE_URL in .env" -ForegroundColor Red
    exit 1
}

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
npx prisma migrate dev --name init

# Seed database (optional)
$seed = Read-Host "Do you want to seed the database with test data? (y/n)"
if ($seed -eq "y" -or $seed -eq "Y") {
    Write-Host "🌱 Seeding database..." -ForegroundColor Cyan
    npm run prisma:seed
}

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server:" -ForegroundColor Cyan
Write-Host "  npm run dev"
Write-Host ""
Write-Host "To start the production server:" -ForegroundColor Cyan
Write-Host "  npm run build"
Write-Host "  npm start"
