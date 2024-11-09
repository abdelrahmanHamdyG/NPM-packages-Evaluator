import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3'; // For typing
import { Readable } from 'stream';

// Create S3 client instance
const s3 = new S3Client({ region: 'us-east-2' }); 

export const uploadZipToS3 = async (bucketName: string, key: string, fileContent: Buffer) => {
    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileContent,
        ContentType: 'application/zip',
    });

    try {
        const response = await s3.send(command);
        console.log(`File uploaded to S3: ${key}. ETag: ${response.ETag}`);
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw error;
    }
};

export const downloadFileFromS3 = async (key: string): Promise<Buffer> => {
    const command = new GetObjectCommand({
        Bucket: 'ece461storage',
        Key: key
    });

    try {
        const response = await s3.send(command);
        const stream = response.Body as Readable;

        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error('Error downloading file from S3:', error);
        throw error;
    }
};

export const clearRegistryInS3 = async (): Promise<void> => {
    const bucketName = 'ece461storage';  // Specify your bucket name here

    try {
        // List all objects in the bucket
        const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
        const listedObjects = await s3.send(listCommand);

        if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
            console.log('No files to delete in the bucket.');
            return;
        }

        // Delete each object individually
        const deletePromises = listedObjects.Contents.map((object) => {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: object.Key!,
            });
            return s3.send(deleteCommand);
        });

        await Promise.all(deletePromises);
        console.log(`All files in bucket ${bucketName} have been deleted.`);
    } catch (error) {
        console.error('Error clearing registry in S3:', error);
        throw error;
    }
};

// Function to update a package in S3 by replacing the content
export const updatePackageInS3 = async ( key: string, newFileContent: Buffer) => {
    const bucketName = 'ece461storage';  // Specify your bucket name here

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: newFileContent,
        ContentType: 'application/zip',  // Assuming the content is a zip file
    });

    try {
        const response = await s3.send(command);
        console.log(`Package updated in S3: ${key}. ETag: ${response.ETag}`);
    } catch (error) {
        console.error('Error updating package in S3:', error);
        throw error;
    }
};