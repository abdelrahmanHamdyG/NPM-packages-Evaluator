import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB, updateDynamoPackagedata, addModuleToDynamoDB} from '../services/dynamoservice.js';
import { downloadFileFromS3,uploadPackage} from '../services/s3service.js';
import {getNPMPackageName, checkNPMOpenSource, getGithubInfo, cloneRepo, zipDirectory, generateId} from '../routes/package_helper.js'
import * as fsExtra from 'fs-extra';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as path from 'path';
import { CLI } from "../../phase-1/CLI.js";
import * as fs from 'fs';
import * as tmp from 'tmp';

const __filename = fileURLToPath(import.meta.url);

const router = Router();
const cli = new CLI();
interface Module {
  id: string;
  name: string;
  version: string;
  s3Key: string;
  uploadType: string;           // Required field
  packageUrl?: string;          // Optional field
}

interface RepoInfo {
    version: string,
    url: string,
}
// This file contains all of the objects for our packages
interface Package {
    metadata: PackageMetadata,
    data: PackageData,
}

interface PackageMetadata {
    Name: string,
    Version: string,
    ID: string
}

interface PackageData {
    Content?: string,
    URL?: string,
    JSProgram?: string,
}

export function extractMetadataFromRepo(repoDir: string): { name: string; version: string; id: string } | null {
  try {
      const packageJsonPath = path.join(repoDir, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
          console.error('package.json not found in the provided directory.');
          return null;
      }

      // Read and parse package.json
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const { name, version } = packageJson;

      if (!name || !version) {
          console.error('Missing name or version in package.json.');
          return null;
      }

      // Generate a unique ID using name and version
      const id = `${name}-${version}`.replace(/[^a-zA-Z0-9_-]/g, '_');

      return { name, version, id };
  } catch (error) {
      console.error('Error extracting metadata from repository:', error);
      return null;
  }
}

// GET /package/:id - Retrieve a package by its ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
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
        // Fetch metadata from DynamoDB
        const packageData = await getPackageFromDynamoDB(id);

        if (!packageData) {
            res.status(404).json({ error: 'Package not found.' });
            return;
        }

        // Download the package content from S3
        const content = await downloadFileFromS3(packageData.s3Key ?? "undefined");

        res.status(200).json({
            metadata: {
                Name: packageData.name,
                Version: packageData.version,
                ID: packageData.id
            },
            data: { Content: content.toString('base64') }  // Return base64-encoded content
        });
    } catch (error) {
        console.error('Error retrieving package:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /package/:id/rate - Retrieve rating for a package by its ID
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
            res.status(404).json({ error: 'Package does not exist.' });
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
        const rcode = await cli.rankModules(tempURLFile.name);
        // Restore the original console.log
        console.log = originalConsoleLog;

        if (rcode) {
            res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
            return;
        }
        
        // Respond with the rating data if successful
        res.status(200).json(JSON.parse(capturedOutput));

    } catch (error) {
        console.error('Error retrieving package rating:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /package - Upload a new package
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const authToken = req.header('X-Authorization');
  const { Content, URL, JSProgram, debloat } = req.body;

  if (!authToken) {
      res.status(403).json({ error: 'Authentication token is missing.' });
      return;
  }

  if (!Content && !URL) {
      res.status(400).json({ error: 'Either URL or Content is required for this operation.' });
      return;
  }

  if (Content && URL) {
      res.status(400).json({ error: 'Both URL and Content cannot be set in the same request.' });
      return;
  }

  try {
      let metadata;
      const tempDir = tmp.dirSync({ unsafeCleanup: true }).name;
      let uploadType = '';
      let s3Key = '';
      let extractedURL = null;

      if (Content) {
          uploadType = 'Content';
          const zipBuffer = Buffer.from(Content, 'base64');
          const zip = new AdmZip(zipBuffer);
          zip.extractAllTo(tempDir, true);

          // Extract metadata
          metadata = extractMetadataFromRepo(tempDir);
      } else if (URL) {
          uploadType = 'URL';
          extractedURL = URL;
          await cloneRepo(URL, tempDir);

          // Extract metadata
          metadata = extractMetadataFromRepo(tempDir);
      }

      if (!metadata) {
          res.status(400).json({ error: 'Failed to extract metadata from the repository or content.' });
          return;
      }

      const { name, version, id } = metadata;
      s3Key = `packages/${id}.zip`;

      // Check if the package already exists
      const existingPackage = await getPackageFromDynamoDB(id);
      if (existingPackage) {
          res.status(409).json({ error: `Package with ID ${id} already exists.` });
          return;
      }

      // Apply debloat if enabled
      if (debloat) {
          console.info('Debloating package...');
          await optimizePackage(tempDir);
      }

      // Recreate ZIP buffer
      const zip = new AdmZip();
      zip.addLocalFolder(tempDir);
      const zipBuffer = zip.toBuffer();

      // Upload package to S3
      await uploadPackage(id, {
          fieldname: 'file',
          originalname: 'zipped_directory.zip',
          encoding: '7bit',
          mimetype: 'application/zip',
          buffer: zipBuffer,
      });

      // Save metadata to DynamoDB
      const packageData = {
          id,
          name,
          version,
          s3Key,
          uploadType, // Specify upload type
          packageUrl: extractedURL, // Save URL if applicable
          createdAt: new Date().toISOString(),
          jsProgram: JSProgram || null,
          debloat: debloat || false,
      };

      await addModuleToDynamoDB({
        id,
        name,
        version,
        s3Key,
        uploadType: Content ? "content" : "URL", // Required field
        packageUrl: URL || undefined,           // Optional field
    });
    
    

      res.status(201).json({
          metadata: {
              Name: name,
              Version: version,
              ID: id,
          },
          data: {
              Content: zipBuffer.toString('base64'),
              URL,
              JSProgram: JSProgram || null,
          },
      });
  } catch (error) {
      console.error('Error handling package upload:', error);
      res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * Optimizes a directory by applying tree shaking and minification.
 * @param dirPath Path to the directory to be optimized.
 */
async function optimizePackage(dirPath: string): Promise<void> {
    try {
        const outputPath = `${dirPath}-optimized`;

        // Use esbuild for tree shaking and minification
        execSync(
            `esbuild ${dirPath} --bundle --minify --outdir=${outputPath} --platform=node`,
            { stdio: 'inherit' }
        );

        // Replace original directory with optimized one
        fsExtra.removeSync(dirPath);
        fsExtra.moveSync(outputPath, dirPath);
    } catch (error) {
        console.error('Error during optimization:', error);
        throw new Error('Debloating failed.');
    }
}

  export default router;