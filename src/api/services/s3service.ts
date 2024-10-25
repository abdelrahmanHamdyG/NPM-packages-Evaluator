import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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