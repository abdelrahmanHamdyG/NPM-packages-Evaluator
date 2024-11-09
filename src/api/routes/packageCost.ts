import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB } from '../services/dynamoservice.js';
import { calculateCostWithDependencies } from '../services/costservice.js';

const router = Router();

// GET /package/:id/cost - Retrieve the cost of a package by its ID, optionally including dependencies
router.get('/:id/cost', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const dependency = req.query.dependency === 'true'; // Query param to include dependencies
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
        // Fetch package metadata from DynamoDB
        const packageData = await getPackageFromDynamoDB(id);

        if (!packageData) {
            res.status(404).json({ error: 'Package not found.' });
            return;
        }

        let totalCost;
        
        if (packageData.id && packageData.name && packageData.version && packageData.s3Key) {
            const totalCost = await calculateCostWithDependencies(packageData, dependency);
        } else {
            // Handle the case where one or more properties are undefined
            throw new Error("Package data is incomplete.");
        }
        res.status(200).json({
            [id]: {
                totalCost: totalCost
            }
        });
    } catch (error) {
        console.error('Error calculating package cost:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
