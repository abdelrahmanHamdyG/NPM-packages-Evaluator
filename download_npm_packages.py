import requests
import os
import tarfile
import io
import zipfile
import shutil

# Create directory to store downloaded packages
output_dir = "npm_packages"
os.makedirs(output_dir, exist_ok=True)

# Read package names from the text file
with open("npm_test_packages_5.txt", "r") as file:
    package_names = [line.strip() for line in file if line.strip()]

# Function to fetch and download a package
def download_package(package_name):
    try:
        # Get package metadata from npm registry
        url = f"https://registry.npmjs.org/{package_name}"
        response = requests.get(url)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        metadata = response.json()
        latest_version = metadata["dist-tags"]["latest"]
        tarball_url = metadata["versions"][latest_version]["dist"]["tarball"]

        # Download tarball
        tarball_response = requests.get(tarball_url, stream=True)
        tarball_response.raise_for_status()

        # Extract the tarball
        tar = tarfile.open(fileobj=io.BytesIO(tarball_response.content), mode="r:gz")
        extract_dir = os.path.join(output_dir, f"{package_name}-{latest_version}")
        os.makedirs(extract_dir, exist_ok=True)
        tar.extractall(path=extract_dir)
        tar.close()

        # Create a zip file from the extracted contents
        zip_filename = os.path.join(output_dir, f"{package_name}-{latest_version}.zip")
        shutil.make_archive(zip_filename.replace('.zip', ''), 'zip', extract_dir)

        # Remove extracted directory after zipping
        shutil.rmtree(extract_dir)

        print(f"Downloaded and re-zipped: {package_name} (version {latest_version})")

    except Exception as e:
        print(f"Failed to download and zip {package_name}: {e}")

# Download each package
for package in package_names:
    download_package(package)
