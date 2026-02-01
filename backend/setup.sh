#!/bin/bash

# 🎵 MusicApp Backend - Quick Setup Script

echo "🎵 MusicApp Backend Setup"
echo "=========================="
echo ""

# Check Python version
echo "✓ Checking Python..."
python3 --version

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with real credentials"
echo "2. Run database schema in Supabase: cat database/schema.sql"
echo "3. Start server: uvicorn app.main:app --reload"
echo ""
