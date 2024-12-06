import express, { Request, Response } from 'express';
import { getPackagesFromDynamoDB } from '../services/dynamoservice.js'; // Assume DynamoDB service exists
import * as semver from 'semver';
import { Logger } from "../../phase-1/logger.js";

const router = express.Router();
const logger = new Logger();

// Define types for request validation
interface PackageQuery {
    Name: string;
    Version: string;
}

interface EnumerateOffset {
    offset?: string; // Optional offset for pagination
}

// Helper function to validate version formats
function isValidVersion(version: string): boolean {
    return semver.valid(version) !== null || semver.validRange(version) !== null;
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate and parse the request body
        const packageQueries: PackageQuery[] = req.body;
        logger.log(1, `Entered POST packages API`); // Debug level logging
        logger.log(1, `Request body: ${JSON.stringify(req.body)}`)
        // if (!Array.isArray(packageQueries) || packageQueries.some(q => !q.Name || !q.Version)) {
        if (!Array.isArray(packageQueries) || packageQueries.some(q => !q.Name || (q.Name !== '*' && !q.Version))) {
            res.status(400).json({
                error: 'Invalid PackageQuery. Ensure the request body contains an array of { Name, Version } objects.',
            });
            return;
        }

        // Validate each version
        for (const query of packageQueries) {
            console.log(query.Version);
            // if (!isValidVersion(query.Version)) {
            if (query.Name !== '*' && !isValidVersion(query.Version)) {
                res.status(400).json({ error: `Invalid version format: ${query.Version}.` });
                return;
            }
        }

        // Extract pagination offset
        const offset = req.query.offset as string | undefined;

        // Fetch packages from the database
        const { packages, nextOffset } = await getPackagesFromDynamoDB(packageQueries, offset);

        // Check if no packages are found
        if (packages.length === 0) {
            res.status(404).json({ error: 'No packages found matching the query.' });
            return;
        }

        // Check for too many packages
        if (packages.length > 100) {
            res.status(413).json({ error: 'Too many packages returned. Refine your query.' });
            return;
        }

        // Respond with the list of packages and the next offset
        res.status(200)
            .set('X-Next-Offset', nextOffset || '')
            .json(packages);
    } catch (error) {
        console.error('Error processing the /packages request:', error);
        res.status(404).json({ error: 'Internal Server Error.' });
    }
});

// export default router;
// import express, { Request, Response } from 'express';
// import { getPackagesFromDynamoDB } from '../services/dynamoservice.js'; // Assume DynamoDB service exists
// import * as semver from 'semver';

// const router = express.Router();

// // Define types for request validation
// interface PackageQuery {
//     Name: string;
//     Version: string;
// }

// interface EnumerateOffset {
//     offset?: string; // Optional offset for pagination
// }

// // Helper function to validate version formats
// function isValidVersion(version: string): boolean {
//     return semver.valid(version) !== null || semver.validRange(version) !== null;
// }

// router.post('/', async (req: Request, res: Response): Promise<void> => {
//     try {
//         // Validate the X-Authorization header
//         const authHeader = req.headers['x-authorization'];
//         if (!authHeader) {
//             res.status(403).json({ error: 'Authentication failed: Missing X-Authorization header.' });
//             return;
//         }

//         // Validate and parse the request body
//         const packageQueries: PackageQuery[] = req.body;
//         if (!Array.isArray(packageQueries) || packageQueries.some(q => !q.Name || !q.Version)) {
//             res.status(400).json({
//                 error: 'Invalid PackageQuery. Ensure the request body contains an array of { Name, Version } objects.',
//             });
//             return;
//         }

//         // Validate each version
//         for (const query of packageQueries) {
//             if (!isValidVersion(query.Version)) {
//                 res.status(400).json({ error: `Invalid version format: ${query.Version}.` });
//                 return;
//             }
//         }

//         // Extract pagination offset
//         const offset = req.query.offset as string | undefined;

//         // Fetch packages from the database
//         const { packages, nextOffset } = await getPackagesFromDynamoDB(packageQueries, offset);

//         // Check if no packages are found
//         if (packages.length === 0) {
//             res.status(404).json({ error: 'No packages found matching the query.' });
//             return;
//         }

//         // Check for too many packages
//         if (packages.length > 100) {
//             res.status(413).json({ error: 'Too many packages returned. Refine your query.' });
//             return;
//         }

//         // Respond with the list of packages and the next offset
//         res.status(200)
//             .set('X-Next-Offset', nextOffset || '')
//             .json(packages);
//     } catch (error) {
//         console.error('Error processing the /packages request:', error);
//         res.status(404).json({ error: 'Internal Server Error.' });
//     }
// });

export default router;