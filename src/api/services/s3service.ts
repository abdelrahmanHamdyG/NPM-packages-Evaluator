import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { GetObjectCommandOutput } from '@aws-sdk/client-s3'; // For typing
import { Readable } from 'stream';

// Create S3 client instance
const s3 = new S3Client({ region: 'us-east-2' }); 
// Upload a file to S3
export const uploadFile = async (bucketName: string, key: string, content: Buffer | string) => {
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: content,
        });

        const response = await s3.send(command);
        console.log(`File uploaded successfully. ${response.ETag}`);
    } catch (error) {
        console.error(`Error uploading file: ${error}`);
    }
};

// Download a file from S3
export const downloadFile = async (bucketName: string, key: string): Promise<string | null> => {
    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });

        const response: GetObjectCommandOutput = await s3.send(command);

        if (response.Body instanceof Readable) {
            const data = await streamToString(response.Body);
            console.log(`File downloaded successfully: ${data}`);
            return data;
        }
        return null;
    } catch (error) {
        console.error(`Error downloading file: ${error}`);
        return null;
    }
};

// Helper function to convert Readable stream to string
const streamToString = (stream: Readable): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        stream.on('error', reject);
    });