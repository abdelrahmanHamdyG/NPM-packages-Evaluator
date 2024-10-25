import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadZipToS3, downloadFileFromS3 } from '../services/s3service.js';
import { addModuleToDynamoDB, getPackageFromDynamoDB } from '../services/dynamoservice.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const upload = multer(); // Initialize multer for file handling

// Mock database/query logic to demonstrate functionality
const mockPackages = [
    { ID: 'underscore', Name: 'Underscore', Version: '1.2.3' },
    { ID: 'lodash', Name: 'Lodash', Version: '1.2.3-2.1.0' },
    { ID: 'react', Name: 'React', Version: '^1.2.3' }
];

// POST /packages - Search for packages
router.post('/', (req: Request, res: Response): void => {
    const queries = req.body;
    const { offset } = req.query;

    // Validate request body
    if (!Array.isArray(queries) || queries.length === 0) {
        res.status(400).json({ error: 'Invalid PackageQuery format or missing fields' });
        return;
    }

    const matchingPackages = queries.flatMap((query) => {
        return mockPackages.filter(pkg => 
            (query.Name === '*' || pkg.Name === query.Name) &&
            (!query.Version || pkg.Version === query.Version)
        );
    });

    if (matchingPackages.length === 0) {
        res.status(404).json({ error: 'No packages found' });
        return;
    }

    const paginatedResults = matchingPackages.slice(Number(offset) || 0, (Number(offset) || 0) + 10);

    res.status(200).set('offset', String((Number(offset) || 0) + paginatedResults.length)).json(paginatedResults);
});

export default router;
