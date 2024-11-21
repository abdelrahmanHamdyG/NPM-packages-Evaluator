import { Router, Request, Response } from 'express';
import { addModuleToDynamoDB, getPackageFromDynamoDB } from '../services/dynamoservice.js';
import { uploadZipToS3, downloadFileFromS3 } from '../services/s3service.js';
import { CLI } from "../../phase-1/CLI.js";
import * as fs from 'fs';
import * as tmp from 'tmp';
import path from 'path';
import AdmZip from 'adm-zip';

const BUCKET_NAME = 'ece461storage'; // Replace with your actual S3 bucket name

const router = Router();
const cli = new CLI();

// GET /package/:id - Retrieve a package by its ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const authToken = req.header('X-Authorization');

    if (!id) {
        res.status(400).json({ error: 'PackageID is missing or malformed.' });
        return;
    }

    if (!authToken) {
        res.status(403).json({ error: 'Authentication token is missing.' });
        return;
    }

    try {
        const packageData = await getPackageFromDynamoDB(id);
        if (!packageData) {
            res.status(404).json({ error: 'Package not found.' });
            return;
        }

        // Download the package content from S3 using the bucket name and S3 key
        const content = await downloadFileFromS3(BUCKET_NAME, packageData.s3Key ?? 'undefined');
        
        res.status(200).json({
            metadata: {
                Name: packageData.name,
                Version: packageData.version,
                ID: packageData.id
            },
            data: { Content: content.toString('base64') } 
        });
    } catch (error) {
        console.error('Error retrieving package:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /package/:id/rate - Retrieve rating for a package by its ID
router.get('/:id/rate', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const authToken = req.header('X-Authorization');

    // Check if the package ID is missing or malformed
    if (!id) {
        res.status(400).json({ error: 'There is missing field(s) in the PackageID.' });
        return;
    }

    // Check for authorization token
    if (!authToken) {
        res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        return;
    }

    try {
        // Fetch metadata from DynamoDB
        const packageData = await getPackageFromDynamoDB(id);

        if (!packageData) {
            res.status(404).json({ error: 'Package does not exist.' });
            return;
        }

        const tempURLFile = tmp.fileSync({ prefix: 'tempURLFile_', postfix: '.txt' });
        fs.writeFileSync(tempURLFile.name, packageData.packageUrl || '');

        // Run CLI tool, capture CLI output to string
        let capturedOutput = '';
        // Backup the original console.log
        const originalConsoleLog = console.log;

        // Override console.log to capture output
        console.log = (message: any) => {
            capturedOutput += message + '\n';
        };
        // Calculate metrics
        const rcode = await cli.rankModules(tempURLFile.name);
        // Restore the original console.log
        console.log = originalConsoleLog;

        if (rcode) {
            res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
            return;
        }
        
        // Respond with the rating data if successful
        res.status(200).json(JSON.parse(capturedOutput));

    } catch (error) {
        console.error('Error retrieving package rating:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
    const authToken = req.header('X-Authorization');
    const { Content, URL, JSProgram, debloat } = req.body;

    if (!authToken) {
        res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        return;
    }

    if (!Content && !URL) {
        res.status(400).json({ error: 'URL or Content is required for this operation.' });
        return;
    }
    
    if (Content && URL) {
        res.status(400).json({ error: 'URL and Content are mutually exclusive.' });
        return;
    }

    try {
        let zipBuffer: Buffer;
        let packageData: any = {};
        const tempDir = tmp.dirSync({ unsafeCleanup: true }).name;

        if (Content) {
            // Decode Base64 Content and save it to a ZIP file
            zipBuffer = Buffer.from(Content, 'base64');
            const zip = new AdmZip(zipBuffer);
            zip.extractAllTo(tempDir, true);
            console.log(fs.readdirSync(tempDir));
 // Extract the content
        } else {
            // Clone repository from the given URL
            await cloneRepository(URL, tempDir);
        }

        // Extract metadata from the repository/package content
        const metadata = extractMetadataFromRepo(tempDir);
        if (!metadata) {
            res.status(400).json({ error: 'Failed to extract metadata from the repository or uploaded content.' });
            return;
        }

        const { name, version, id } = metadata;
        const s3Key = `packages/${id}.zip`;

        // Recreate ZIP buffer from the extracted content
        const zip = new AdmZip();
        zip.addLocalFolder(tempDir);
        zipBuffer = zip.toBuffer();

        // Upload to S3
        await uploadZipToS3(BUCKET_NAME, s3Key, zipBuffer);

        // Save metadata to DynamoDB
        packageData = {
            id,
            name,
            version,
            s3Key,
            packageUrl: URL || null,
            createdAt: new Date().toISOString(),
            jsProgram: JSProgram || null,
            debloat: debloat || false,
        };

        await addModuleToDynamoDB(packageData);

        res.status(201).json({
            metadata: {
                Name: name,
                Version: version,
                ID: id,
            },
            data: {
                Content: zipBuffer.toString('base64'),
                URL,
                JSProgram: JSProgram || null,
            },
        });
    } catch (error) {
        console.error('Error handling package upload:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;

import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function cloneRepository(repoUrl: string, destDir: string): Promise<void> {
    if (repoUrl.includes('github.com')) {
        await execAsync(`git clone ${repoUrl} ${destDir}`);
    } else {
        throw new Error('Unsupported repository URL');
    }
}

export function extractMetadataFromRepo(repoDir: string): { name: string; version: string; id: string } | null {
    const packageJsonPath = path.join(repoDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return null;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const { name, version } = packageJson;

    return {
        name,
        version,
        id: `${name}-${version}`.replace(/[^a-zA-Z0-9_-]/g, '_'), // Generate a valid ID
    };
}
