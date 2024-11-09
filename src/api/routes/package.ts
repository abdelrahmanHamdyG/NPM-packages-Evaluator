import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB, savePackageToDynamoDB, searchPackagesByRegEx } from '../services/dynamoservice.js';
import { downloadFileFromS3, uploadZipToS3 } from '../services/s3service.js';
import { v4 as uuidv4 } from 'uuid';


const router = Router();

// Define your S3 bucket name here (replace 'ece461storage' with your actual bucket name)
const BUCKET_NAME = 'ece461storage';

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


// POST /package - Create a new package
router.post('/', async (req: Request, res: Response): Promise<void> => {
    const authToken = req.header('X-Authorization');
    const { name, version, content } = req.body;

    if (!authToken) {
        res.status(403).json({ error: 'Authentication token is missing.' });
        return;
    }

    if (!name || !version || !content) {
        res.status(400).json({ error: 'Name, version, or content is missing.' });
        return;
    }

    try {
        const packageId = uuidv4();
        const s3Key = `packages/${packageId}`;

        // Upload content to S3 with all required parameters
        await uploadZipToS3(BUCKET_NAME, s3Key, Buffer.from(content, 'base64'));

        // Save metadata to DynamoDB
        const packageData = {
            id: packageId,
            name,
            version,
            s3Key
        };
        await savePackageToDynamoDB(packageData);

        res.status(201).json({
            message: 'Package created successfully.',
            packageId,
            metadata: {
                name,
                version,
                id: packageId
            }
        });
    } catch (error) {
        console.error('Error creating package:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /package/byRegEx - Search packages by regular expression
router.post('/byRegEx', async (req: Request, res: Response): Promise<void> => {
    const authToken = req.header('X-Authorization');
    const { pattern } = req.body;

    if (!authToken) {
        res.status(403).json({ error: 'Authentication token is missing.' });
        return;
    }

    if (!pattern) {
        res.status(400).json({ error: 'Pattern is missing.' });
        return;
    }

    try {
        // Search for packages matching the regular expression
        const regex = new RegExp(pattern, 'i');
        const matchedPackages = await searchPackagesByRegEx(regex);

        if (matchedPackages.length === 0) {
            res.status(404).json({ message: 'No packages matched the pattern.' });
            return;
        }

        res.status(200).json({
            message: 'Packages matched successfully.',
            matchedPackages
        });
    } catch (error) {
        console.error('Error searching packages by regex:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
