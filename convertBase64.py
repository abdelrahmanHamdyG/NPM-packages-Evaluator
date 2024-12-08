import base64
import requests
import os

def download_and_convert_to_base64(url, output_file=None):
    """
    Downloads a ZIP file from the given URL, converts it to a Base64 string, and optionally saves the output.

    :param url: URL of the ZIP file to download
    :param output_file: Path to save the Base64-encoded string (optional)
    :return: Base64-encoded string of the ZIP file
    """
    try:
        # Download the ZIP file
        print(f"Downloading from {url}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise an error for failed HTTP requests
        
        # Save the ZIP file locally
        zip_filename = "temp_package.zip"
        with open(zip_filename, "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
        
        print(f"Downloaded ZIP file saved as {zip_filename}")
        
        # Read the ZIP file and encode it to Base64
        with open(zip_filename, "rb") as file:
            base64_data = base64.b64encode(file.read()).decode('utf-8')
        
        print("Converted ZIP file to Base64 string.")
        
        # Optionally save the Base64 string to a file
        if output_file:
            with open(output_file, "w") as file:
                file.write(base64_data)
            print(f"Base64 string saved to {output_file}")
        
        # Clean up the temporary ZIP file
        os.remove(zip_filename)
        print(f"Temporary ZIP file {zip_filename} removed.")
        
        return base64_data

    except requests.exceptions.RequestException as e:
        print(f"Error during file download: {e}")
    except Exception as e:
        print(f"Error: {e}")

# Example usage
if __name__ == "__main__":
    # URL of the ZIP file
    package_url = "https://github.com/dominictarr/JSONStream"
    # Optional output file for Base64 string
    base64_output_file = "package_base64.txt"

    # Convert ZIP to Base64
    base64_string = download_and_convert_to_base64(package_url, base64_output_file)

    # Print the Base64 string (for demonstration purposes)
    if base64_string:
        print(base64_string)  # Print the first 200 characters for brevity
