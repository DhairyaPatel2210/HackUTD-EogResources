# Use Python 3.12 as the base image
FROM python:3.12-alpine

# Set working directory inside the container
WORKDIR /app

# Copy the requirements file first (for better Docker caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Python script into the container
COPY . .

# Command to run the Python script when the container starts
CMD ["python3", "rabbitmq_worker.py"]
