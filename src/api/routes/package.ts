import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB } from '../services/dynamoservice.js';
import { downloadFileFromS3 } from '../services/s3service.js';

const router = Router();

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

export default router;