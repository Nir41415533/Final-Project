import os

# Basic configuration
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"
workers = 2  # Reduced from default to save memory
worker_class = "sync"
worker_connections = 1000

# Timeout configuration
timeout = 120  # Increased from default 30s for large data operations
keepalive = 5
max_requests = 1000  # Restart workers after 1000 requests to prevent memory leaks
max_requests_jitter = 50

# Memory optimization
preload_app = True  # Share code between workers
worker_tmp_dir = "/dev/shm"  # Use memory for temporary files

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "ww2map"

# Security
limit_request_line = 4094
limit_request_fields = 100

# Resource limits  
worker_memory_limit = 256 * 1024 * 1024  # 256MB per worker
worker_rlimit_nofile = 1024

print(f"Gunicorn config loaded: {workers} workers, timeout={timeout}s") 