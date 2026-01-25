#!/bin/bash

# Smart Link Hub Backend Setup Script

echo "🚀 Setting up Smart Link Hub Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and set your DATABASE_URL and JWT_SECRET"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run prisma:generate

# Check if database is accessible
echo "🔍 Checking database connection..."
if npx prisma db pull > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed. Please check your DATABASE_URL in .env"
    exit 1
fi

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed database (optional)
read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run prisma:seed
fi

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To start the production server:"
echo "  npm run build"
echo "  npm start"
