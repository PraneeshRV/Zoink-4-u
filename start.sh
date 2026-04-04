#!/bin/bash
echo "Starting Zoink-4-u Phase 2 Architecture..."

# Setup Python Virtual Environment automatically if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment and installing dependencies..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
    pip install -r ml_engine/requirements.txt
else
    source venv/bin/activate
fi

# Start Backend on Port 8000
cd backend
uvicorn app.main:app --port 8000 &
BACKEND_PID=$!
cd ..

# Start ML Engine on Port 8001
cd ml_engine
uvicorn app.main:app --port 8001 &
ML_PID=$!
cd ..

echo "Backend running on http://localhost:8000"
echo "ML Engine running on http://localhost:8001"

# Start Frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Frontend UI running on http://localhost:5173"

# Wait for processes
wait $BACKEND_PID $ML_PID $FRONTEND_PID
