import { Router, Request, Response } from 'express';
import { getPackagesFromDynamoDB, Module } from '../services/dynamoservice.js';  // Assuming you have a DynamoDB service
import { format } from 'path';

const router = Router();

// POST /packages - Search or list packages
router.post('/', async (req: Request, res: Response): Promise<void> => {
    const authToken = req.header('X-Authorization');
    const offset = req.query.offset as string || '0';  // Default to '0' if no offset is provided
    // const queries: Module[] = req.body;
    const queries: { Name: string, Version: string }[] = req.body;

    // Validate authentication token
    if (!authToken) {
        res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        return;
    }

    // Validate request body
    if (!Array.isArray(queries) || queries.some(query => !query.Name || !query.Version)) {
        res.status(400).json({ error: 'There are missing field(s) in the PackageQuery or it is malformed.' });
        return;
    }

    try {
        // Retrieve packages from DynamoDB based on the query and pagination
        const { packages, nextOffset } = await getPackagesFromDynamoDB(queries, offset);

        if (!packages || packages.length === 0) {
            res.status(404).json({ error: 'No packages match the query criteria.' });
            return;
        }

        // Add pagination information in headers
        res.setHeader('offset', nextOffset);

        // Respond with the list of packages
        // res.status(200).json("ID":packages.id);
        const packageMetadata = packages.map((pkg) => ({
            Name: pkg.name,
            Version: pkg.version,
            ID: pkg.id
        }));
        
        // Send the metadata response
        res.status(200).json(packageMetadata);
    } catch (error:unknown) {
        // Custom error handling for specific cases like too many items
        if (error instanceof Error) {
            if (error.message === 'Too many packages returned') {
                res.status(413).json({ error: 'Too many packages returned. Refine the query.' });
            } else {
                console.error('Error retrieving packages:', error);
                res.status(500).json({ error: 'Internal server error.' });
            }
    }}
});

export default router;