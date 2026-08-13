FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download spacy model
RUN python -m spacy download en_core_web_sm

# Copy application files
COPY . .

# Expose ports
EXPOSE 5005 5055

# Default command - train model and start server
CMD ["sh", "-c", "rasa train && rasa run -m models --enable-api --cors '*' --port 5005 & rasa run actions --port 5055"]
