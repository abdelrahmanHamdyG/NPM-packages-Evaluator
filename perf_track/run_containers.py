import threading
import time
import docker
import numpy as np
import statistics

# Initialize the Docker client
client = docker.from_env()

# Number of containers to run
num_containers = 100
image_name = 'api_test'  # Replace with the name of the image you're using

# List to store latencies
latencies = []

# Function to run a container
def run_container(container_index):
    try:
        print(f"Starting container {container_index}...")
        start_time = time.time()  # Record the start time

        # Run the container (simulating a GET request to the API)
        container = client.containers.run(image_name, command="curl -s http://localhost:3000/package/lodash", detach=True)
        container_status = container.wait()  # Wait for container to finish

        end_time = time.time()  # Record the end time
        latency = end_time - start_time  # Calculate latency
        latencies.append(latency)  # Store the latency

        print(f"Container {container_index} completed with latency {latency:.2f}s and status {container_status}")

    except Exception as e:
        print(f"Error running container {container_index}: {e}")

# Function to spawn containers using threading
def run_containers():
    threads = []
    start_time = time.time()  # Record the start time for all containers
    
    for i in range(num_containers):
        thread = threading.Thread(target=run_container, args=(i,))
        threads.append(thread)
        thread.start()

    # Join all threads to ensure they complete
    for thread in threads:
        thread.join()

    end_time = time.time()  # Record the end time for all containers
    print(f"All containers finished. Total time: {end_time - start_time:.2f} seconds")

    # Calculate and print latency statistics
    calculate_latency_statistics()

# Function to calculate and display latency statistics
def calculate_latency_statistics():
    if not latencies:
        print("No latency data to analyze.")
        return

    # Mean latency
    mean_latency = statistics.mean(latencies)
    print(f"Mean Latency: {mean_latency:.4f}s")

    # Median latency
    median_latency = statistics.median(latencies)
    print(f"Median Latency: {median_latency:.4f}s")

    # 99th percentile latency
    percentile_99 = np.percentile(latencies, 99)
    print(f"99th Percentile Latency: {percentile_99:.4f}s")

# Run the containers
if __name__ == "__main__":
    run_containers()
