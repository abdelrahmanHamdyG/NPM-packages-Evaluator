import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getPackageFromDynamoDB} from '../services/dynamoservice.js';

const router = Router();
const BASE_DIRECTORY = '/home/ec2-user/npm_packages'; // Base directory for local files

// GET /tracks - Retrieve the list of planned tracks
router.get('/', async (req: Request, res: Response) => {
  try {
    const plannedTracks = [
      "Performance track"
    ];

    // Send the response with the planned tracks
    res.status(200).json({ plannedTracks });
  } catch (error) {
    console.error('Error retrieving tracks:', error);
    res.status(500).json({ error: 'Internal server error while retrieving track information.' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const packageIdRegex = /^[a-zA-Z0-9-_]+$/; // Matches alphanumeric, hyphen, and underscore

    if (!id || !packageIdRegex.test(id)) {
        res.status(400).json({ error: 'PackageID is missing or malformed.' });
        return;
    }

    try {
        // Fetch metadata from DynamoDB
        const packageData = await getPackageFromDynamoDB(id);

        if (!packageData) {
            res.status(404).json({ error: 'Package not found.' });
            return;
        }
        // Resolve the full path to the requested package
        const filePath = path.join(BASE_DIRECTORY, packageData.s3Key);

        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ error: 'Package not found.' });
            return;
        }

        // Read the file content
        const content = fs.readFileSync(filePath);

        // Send the file content in base64 format
        res.status(200).json({
            metadata: {
                ID: id,
                Path: filePath,
            },
            data: { Content: content.toString('base64') }, // Base64-encoded content
        });
    } catch (error) {
        console.error('Error serving package:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;