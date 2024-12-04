import os, time
import requests
import base64

# Directory containing the zipped npm packages
package_directory = "../../npm_packages"  
# API endpoint and authorization token
api_url = "http://localhost:3000/package" 
auth_token = "Bearer feiojfsiego"  

# Function to read and encode the zip file
def encode_zip_file(file_path):
    with open(file_path, "rb") as file:
        encoded_content = base64.b64encode(file.read()).decode("utf-8")
    return encoded_content

# Loop through all zip files in the directory and upload each
def upload_packages(directory):
    for filename in os.listdir(directory):
        if filename.endswith(".zip"):
            package_name = os.path.splitext(filename)[0]
            file_path = os.path.join(directory, filename)
            print(f"Uploading {package_name}...")

            # Encode the zip file to base64
            encoded_content = encode_zip_file(file_path)

            # Create the payload
            payload = {
                "Content": encoded_content,
                "Name": package_name
            }

            # Make the POST request
            headers = {
                "Content-Type": "application/json",
                "X-Authorization": auth_token
            }

            try:
                response = requests.post(api_url, json=payload, headers=headers)
                if response.status_code == 201:
                    print(f"Successfully uploaded {package_name}")
                else:
                    print(f"Failed to upload {package_name}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Error uploading {package_name}: {str(e)}")
            time.sleep(0.1)

# Run the function
upload_packages(package_directory)
