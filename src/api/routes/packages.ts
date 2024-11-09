import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB } from '../services/dynamoservice.js';
import { CLI } from "../../phase-1/CLI.js";
import * as fs from 'fs';
import * as tmp from 'tmp';

export const getPackageRating = async (packageId: string): Promise<any> => {
    // Simulate a dummy rating response
    return {
        packageId,
        metricsIncomplete: false, // Assume all metrics are computed successfully
        rating: {
            correctness: 0.8,
            busFactor: 0.6,
            rampUp: 0.7,
            responsiveMaintainer: 0.75,
            license: 0.9
        },
        netScore: 0.75 // Example net score
    };
};

const router = Router();
const cli = new CLI();

// GET /packages/:id/rate - Retrieve rating for a package by its ID
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
            res.status(404).json({ error: 'Package not found.' });
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
        cli.rankModules(tempURLFile.name)
        // Restore the original console.log
        console.log = originalConsoleLog;
        
        // Fetch the package rating
        const rating = await getPackageRating(id);

        // Check if the package rating data exists
        if (!rating) {
            res.status(404).json({ error: 'Package does not exist.' });
            return;
        }

        // Check if all metrics were computed successfully
        if (rating.metricsIncomplete) {
            res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
            return;
        }

        // Respond with the rating data if successful
        res.status(200).json(rating);

    } catch (error) {
        console.error('Error retrieving package rating:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;