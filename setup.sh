#!/bin/bash
# Setup script for the Compress Flask Application

echo "Setting up Compress Flask Application..."

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
echo "Activating virtual environment..."
./venv/Scripts/Activate.ps1

# Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install compatible versions to avoid numba/scipy issues on Windows
echo "Installing compatible dependencies..."
pip install numba==0.58.1 scipy==1.11.4
pip install opencv-python-headless==4.10.0.84
pip install rembg==2.0.67

# Install all other requirements
echo "Installing remaining requirements..."
pip install -r requirements.txt

# Create uploads directory
echo "Creating uploads directory..."
mkdir -p uploads

echo "Setup complete!"
echo "To run the application:"
echo "1. Activate virtual environment: ./venv/Scripts/Activate.ps1"
echo "2. Run: python application.py"
echo "3. Open browser to: http://127.0.0.1:5000"