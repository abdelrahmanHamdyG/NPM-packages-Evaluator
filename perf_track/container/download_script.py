import requests
import time

api_url = "http://52.15.245.119:3000/package/lodash-4_17_21"  # Replace with your actual API endpoint
headers = {
    "X-Authorization": "Bearer <your-token-here>"  
}

start_time = time.time()
try:
    response = requests.get(api_url, headers=headers)
    if response.status_code == 200:
        elapsed_time = time.time() - start_time
        print(f"Downloaded in {elapsed_time:.2f} seconds")
    else:
        print(f"Error: {response.status_code}")
except Exception as e:
    print(f"Request failed: {e}")