import { Router, Request, Response } from 'express';
import { clearRegistryInDynamoDB } from '../services/dynamoservice.js';
import { clearRegistryInS3 } from '../services/s3service.js';
import { Logger } from "../../phase-1/logger.js";

const router = Router();
const logger = new Logger();

/// DELETE /reset - Reset the registry
router.delete('/', async (req: Request, res: Response): Promise<void> => {
    logger.log(1, 'DELETE /reset hit');
    try {
        // Call functions to clear the registry
        await clearRegistryInDynamoDB();
        await clearRegistryInS3();

        // Respond with success message
        res.status(200).json({ message: 'Registry is reset.' });
    } catch (error) {
        console.error('Error resetting registry:', error);

        // Internal server error response
        res.status(500).json({ error: 'Internal server error.' });
    }
});


export default router;



