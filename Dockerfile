# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create app directory
WORKDIR /app

# Install system dependencies (needed for Pillow, pdfkit, rembg, etc.)
RUN apt-get update && apt-get install -y \
    build-essential \
    poppler-utils \
    wkhtmltopdf \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy project files
COPY . .

# Expose port (Railway uses $PORT)
EXPOSE 8000

# Run Flask app with Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app"]
