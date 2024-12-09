import os
import paramiko

ec2_public_dns = "ec2-18-117-89-241.us-east-2.compute.amazonaws.com"  
pem_key_path = "C:/Users/parth/Downloads/ece30861defaultadminuser.pem" 
local_directory = "../../npm_packages" 
remote_directory = "/home/ec2-user/npm_packages"  

def upload_zip_files():
    # Create SSH client
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        # Connect to EC2 instance
        ssh.connect(hostname=ec2_public_dns, username="ec2-user", key_filename=pem_key_path)
        print(f"Connected to {ec2_public_dns}")

        # Start SFTP session
        sftp = ssh.open_sftp()

        # Create remote directory if it doesn't exist
        try:
            sftp.stat(remote_directory)
        except FileNotFoundError:
            sftp.mkdir(remote_directory)
            print(f"Created directory {remote_directory} on EC2")

        # Upload all .zip files
        for file_name in os.listdir(local_directory):
            if file_name.endswith(".zip"):
                local_file = os.path.join(local_directory, file_name)
                remote_file = f"{remote_directory}/{file_name}"
                sftp.put(local_file, remote_file)
                print(f"Uploaded: {file_name}")

        sftp.close()
        print("All files uploaded successfully!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    upload_zip_files()
