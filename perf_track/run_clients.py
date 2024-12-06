import requests
import threading
import time
import statistics

# API URL 
API_URL = "http://3.129.57.219:3000/package/lodash-4_17_21"

# Authentication token (replace with your token)
AUTH_TOKEN = "Bearer abcd"

# Number of concurrent threads
NUM_THREADS = 100

# Store latencies for analysis
latencies = []

# Function to call the REST API and measure latency
def call_api(thread_id):
    global latencies
    headers = {
        "X-Authorization": AUTH_TOKEN
    }
    start_time = time.time()
    
    try:
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()  # Raise an error for bad responses
        end_time = time.time()
        
        latency = (end_time - start_time) * 1000  # Convert to milliseconds
        latencies.append(latency)
        
        print(f"Thread {thread_id}: Success, Latency: {latency:.2f} ms")
    except requests.exceptions.RequestException as e:
        print(f"Thread {thread_id}: Failed, Error: {e}")

# Create and start threads
threads = []
for i in range(NUM_THREADS):
    thread = threading.Thread(target=call_api, args=(i,))
    threads.append(thread)
    thread.start()

# Wait for all threads to complete
ctr = 0
for thread in threads:
    thread.join()
    ctr += 1
    print(ctr)

# Calculate and print performance metrics
if latencies:
    mean_latency = statistics.mean(latencies)
    median_latency = statistics.median(latencies)
    p99_latency = statistics.quantiles(latencies, n=100)[98]  # 99th percentile approximation

    print("\nPerformance Metrics:")
    print(f"Mean Latency: {mean_latency:.2f} ms")
    print(f"Median Latency: {median_latency:.2f} ms")
    print(f"99th Percentile Latency: {p99_latency:.2f} ms")
else:
    print("No successful API calls were made.")
