import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB, updatePackageInDynamoDB } from '../services/dynamoservice.js'; // Adjust imports based on your project structure
import { updatePackageInS3 } from '../services/s3service.js';

const router = Router();
interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
}
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
