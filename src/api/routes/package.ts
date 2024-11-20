import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB, updatePackageInDynamoDB } from '../services/dynamoservice.js';
import { downloadFileFromS3,updatePackageInS3 } from '../services/s3service.js';
import { CLI } from "../../phase-1/CLI.js";
import * as fs from 'fs';
import * as tmp from 'tmp';

const router = Router();
const cli = new CLI();
interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
}

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
        // Fetch metadata from DynamoDB
        const packageData = await getPackageFromDynamoDB(id);

        if (!packageData) {
            res.status(404).json({ error: 'Package not found.' });
            return;
        }

        // Download the package content from S3
        const content = await downloadFileFromS3(packageData.s3Key ?? "undefined");

        res.status(200).json({
            metadata: {
                Name: packageData.name,
                Version: packageData.version,
                ID: packageData.id
            },
            data: { Content: content.toString('base64') }  // Return base64-encoded content
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

// PUT /package/:id - Update a package's content by its ID
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const authToken = req.header('X-Authorization');
    const newContent = req.body.content;  // Assuming new content is sent in the request body (base64 encoded)

    if (!id) {
        res.status(400).json({ error: 'PackageID is missing or malformed.' });
        return;
    }

    if (!authToken) {
        res.status(403).json({ error: 'Authentication token is missing.' });
        return;
    }

    if (!newContent) {
        res.status(400).json({ error: 'New content is missing.' });
        return;
    }

    try {
        // Fetch package metadata from DynamoDB
        const packageData = await getPackageFromDynamoDB(id);

        if (!packageData) {
            res.status(404).json({ error: 'Package not found.' });
            return;
        }

        // Update the package content in S3
        const s3Key = packageData.s3Key ?? "undefined";  // Ensure that s3Key is valid
        const bufferContent = Buffer.from(newContent, 'base64');  // Convert base64 to Buffer for S3

        // Update the package content in S3
        await updatePackageInS3(s3Key, bufferContent);

        // Prepare the update data for DynamoDB (no 'lastUpdated' field)
        const updateData: Partial<Module> = {
            // Only fields that exist in the Module interface should be updated.
            version: packageData.version,  // For example, version could be updated, if needed.
            s3Key: packageData.s3Key,  // Ensure s3Key is part of the update, but don't modify it unnecessarily
            name: packageData.name,  // Same for name, modify only if needed.
        };

        // Update the package metadata in DynamoDB
        await updatePackageInDynamoDB(id, updateData);

        res.status(200).json({ message: 'Package content updated successfully.' });
    } catch (error) {
        console.error('Error updating package:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


export default router;