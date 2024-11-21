import { Router, Request, Response } from 'express';
import { addModuleToDynamoDB } from '../services/dynamoservice.js';

const router = Router();

// POST /packages - Add a new package to the registry
router.post('/', async (req: Request, res: Response): Promise<void> => {
    const authToken = req.header('X-Authorization');
    const { id, name, version, s3Key } = req.body;

    // Validate required fields
    if (!authToken) {
        res.status(403).json({ error: 'Authentication token is missing.' });
        return;
    }

    if (!id || !name || !version || !s3Key  === undefined) {
        res.status(400).json({ error: 'Missing required fields: id, name, version, s3Key' });
        return;
    }

    try {
        // Add the new package to DynamoDB
        await addModuleToDynamoDB({ id, name, version, s3Key});

        res.status(201).json({ message: 'Package added successfully.', package: { id, name, version } });
    } catch (error) {
        console.error('Error adding package to registry:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
