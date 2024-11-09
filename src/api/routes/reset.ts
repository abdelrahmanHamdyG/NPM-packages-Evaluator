import { Router, Request, Response } from 'express';
import { clearRegistryInDynamoDB } from '../services/dynamoservice.js';
import { clearRegistryInS3 } from '../services/s3service.js';

const router = Router();

// DELETE /reset - Reset the registry
router.delete('/reset', async (req: Request, res: Response): Promise<void> => {
    try {
        // Clear package metadata from DynamoDB
        await clearRegistryInDynamoDB();
        
        // Optionally clear package contents from S3
        await clearRegistryInS3();
        
        res.status(200).json({ message: 'Registry has been reset to baseline.' });
    } catch (error) {
        console.error('Error resetting registry:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;



