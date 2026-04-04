#!/bin/bash
echo "════════════════════════════════════════════════"
echo "  🚀 Starting Zoink-4-u Phase 2 Architecture"
echo "════════════════════════════════════════════════"

# Check if PostgreSQL is running
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        echo "✅ PostgreSQL is running"
    else
        echo "⚠️  WARNING: PostgreSQL does not appear to be running!"
        echo "   Please start PostgreSQL and create the 'zoinkdb' database:"
        echo "   sudo service postgresql start"
        echo "   sudo -u postgres createdb zoinkdb"
        echo "   sudo -u postgres psql -c \"CREATE USER zoink WITH PASSWORD 'zoink';\""
        echo "   sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE zoinkdb TO zoink;\""
        echo ""
    fi
else
    echo "⚠️  pg_isready not found — cannot check PostgreSQL status"
fi

# Setup Python Virtual Environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing backend dependencies..."
    pip install -r backend/requirements.txt
    echo "📦 Installing ML engine dependencies..."
    pip install -r ml_engine/requirements.txt
else
    source venv/bin/activate
fi

# Run database initialization and seeding
echo "🗄️  Initializing database and seed data..."
cd backend
python -m app.init_db
cd ..

# Install frontend npm deps if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start Backend on Port 8000
echo "🔧 Starting Backend on http://localhost:8000..."
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Start ML Engine on Port 8001
echo "🧠 Starting ML Engine on http://localhost:8001..."
cd ml_engine
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
ML_PID=$!
cd ..

# Start Frontend on Port 5173
echo "🎨 Starting Frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "════════════════════════════════════════════════"
echo "  ✅ All services started!"
echo "  📱 Frontend:  http://localhost:5173"
echo "  🔧 Backend:   http://localhost:8000"
echo "  🧠 ML Engine: http://localhost:8001"
echo "  📊 API Docs:  http://localhost:8000/docs"
echo "════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup on exit
trap "kill $BACKEND_PID $ML_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for processes
wait $BACKEND_PID $ML_PID $FRONTEND_PID
