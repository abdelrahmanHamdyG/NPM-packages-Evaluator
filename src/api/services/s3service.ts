import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Initialize S3 client
const s3 = new S3Client({ region: 'us-east-2' });

// Function to upload a zip file to S3
export const uploadZipToS3 = async (bucketName: string, key: string, fileContent: Buffer): Promise<void> => {
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

// Function to download a file from S3 as a Buffer
export const downloadFileFromS3 = async (bucketName: string, key: string): Promise<Buffer> => {
    const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    try {
        const response = await s3.send(command);
        const stream = response.Body as Readable;

        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error('Error downloading file from S3:', error);
        throw error;
    }
};
