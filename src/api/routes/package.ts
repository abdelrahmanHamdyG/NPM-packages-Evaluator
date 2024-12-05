import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB, updateDynamoPackagedata, getPackagesByRegex, addModuleToDynamoDB} from '../services/dynamoservice.js';
import { downloadFileFromS3,uploadPackage} from '../services/s3service.js';
import {getNPMPackageName, checkNPMOpenSource, getGithubInfo, cloneRepo, cloneRepo2, zipDirectory, debloatZippedFile, generateId} from '../routes/package_helper.js'
import * as fsExtra from 'fs-extra';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';
import { CLI } from "../../phase-1/CLI.js";
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';
import yauzl from 'yauzl';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
const versionRegex = /^(\d+)\.(\d+)\.(\d+)$/; // Regular expression to match Semantic Versioning (Major.Minor.Patch)

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();
const cli = new CLI();
interface Module {
  id: string;
  name: string;
  version: string;
  s3Key: string;
  uploadType: string ;           // Required field
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
    ID: string,

}

interface PackageData {
    Content?: string,
    URL?: string,
    JSProgram?: string,
    
}

// Define interfaces for clarity
interface CostResponse {
  [key: string]: {
      totalCost: number;
      standaloneCost?: number;
  };
}

interface CostCalculationResult {
  standaloneCost: number;
  totalCost: number;
  hasDependencies: boolean;
}

export function extractMetadataFromRepo(repoDir: string): { name: string; version: string; id: string; url?: string } | null {
  try {
    let packageJsonPath = path.join(repoDir, 'package.json');

    // Check if package.json exists directly in repoDir
    if (!fs.existsSync(packageJsonPath)) {
      // Get the list of entries in repoDir
      const entries = fs.readdirSync(repoDir, { withFileTypes: true });
      
      // Find the first (and only) subdirectory if it exists
      const subDir = entries.find(entry => entry.isDirectory());
      if (subDir && entries.length === 1) {
        // Construct the path to package.json inside the subdirectory
        packageJsonPath = path.join(repoDir, subDir.name, 'package.json');
      } else {
        console.error('package.json not found in the provided directory.');
        return null;
      }
    }

    // Check if package.json exists at the determined path
    if (!fs.existsSync(packageJsonPath)) {
      console.error('package.json not found.');
      return null;
    }

    // Read and parse package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const { name, version, repository } = packageJson;

    if (!name || !version) {
      console.error('Missing name or version in package.json.');
      return null;
    }

    // Extract URL from the repository field, if present
    let url: string | undefined = repository?.url;

    // Normalize the URL to start with 'https://github.com/'
    if (url) {
      // Remove 'git+' prefix if it exists
      url = url.replace(/^git\+/, '');

      // Replace 'git://' or 'http://' with 'https://'
      url = url.replace(/^git:\/\//, 'https://')
              .replace(/^http:\/\//, 'https://');

      // Ensure it's a GitHub URL and normalize it
      const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
      const match = url.match(githubRegex);

      if (match) {
        const username = match[1];
        const repoName = match[2].replace(/\.git$/, ''); // Remove .git suffix if present
        url = `https://github.com/${username}/${repoName}`;
      } else {
        console.error('Invalid GitHub URL format:', url);
        return null; // Return null if it's not a valid GitHub URL
      }
    }

    // Log the formatted URL for verification
    console.log('Normalized URL:', url);


    // Generate a unique ID using name and version
    const id = `${name}-${version}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    return { name, version, id, url };
  } catch (error) {
    console.error('Error extracting metadata from repository:', error);
    return null;
  }
}


// GET /package/:id - Retrieve a package by its ID
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

    // Check if the package ID is missing or malformed
    if (!id) {
        res.status(400).json({ error: 'There is missing field(s) in the PackageID.' });
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

function extractRepoInfo(zipFilePath: string): Promise<RepoInfo> {
    return new Promise(async (resolve, reject) => {
      yauzl.open(zipFilePath, { lazyEntries: true }, (err: Error | null, zipfile: any | null) => {
        if (err || !zipfile) {
          reject(err || new Error('Unable to open zip file'));
          return "Unable to open zip file";
        }
  
        zipfile.on('entry', async (entry: any) => {
          //console.info(`Entry Name: ${entry.fileName}`);
          if (/\/package\.json$/.test(entry.fileName)) {
            zipfile.openReadStream(entry, (err: Error | null, readStream: NodeJS.ReadableStream | null) => {
              if (err || !readStream) {
                reject(err || new Error('Unable to read package.json'));
                return "Unable to read package.json";
              }
  
              let fileContent = '';
              readStream.on('data', (data: Buffer) => {
                fileContent += data;
              });
  
              readStream.on('end', () => {
                try {
                  const jsonObject = JSON.parse(fileContent);
                  if ('repository' in jsonObject && 'url' in jsonObject.repository && 'version' in jsonObject) {
                    const info : RepoInfo = {
                      version: jsonObject.version,
                      url: jsonObject.repository.url
                    }
                    resolve(info)
                  } else {
                    reject(new Error('Repository URL not found in package.json'));
                  }
                } catch (parseError) {
                  reject(new Error('Error parsing package.json'));
                }
              });
            });
          } else {
            zipfile.readEntry();
          }
        });
  
        zipfile.on('end', () => {
          reject(new Error('Package.json not found in the zip'));
        });
  
        zipfile.readEntry();
      });
    });
}


const validateVersion = (version: string) => {
    return versionRegex.test(version);  // Returns true if the version matches the regex
};

const validatePatchVersionSequence = (existingVersion: string, newVersion: string) => {
    const [existingMajor, existingMinor, existingPatch] = existingVersion.split('.').map(Number);
    const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number);

    if (newMajor < existingMajor) return false; // Major version cannot be decreased
    if (newMajor === existingMajor && newMinor < existingMinor) return false; // Minor version cannot be decreased
    if (newMajor === existingMajor && newMinor === existingMinor && newPatch <= existingPatch) return false; // Patch version must be strictly greater than the existing patch version

    return true;
};

router.post('/byRegEx', async (req: Request, res: Response): Promise<void> => {
  const { RegEx } = req.body;

  if (!RegEx || typeof RegEx !== 'string') {
      res.status(400).json({ error: 'There is missing field(s) in the PackageRegEx or it is formed improperly.' });
      return;
  }

  try {
      // Fetch packages matching the regex
      const packages = await getPackagesByRegex(RegEx);

      if (packages.length === 0) {
          res.status(404).json({ error: 'No package found under this regex.' });
          return;
      }

      res.status(200).json(packages);
  } catch (error) {
      console.error('Error retrieving packages by regex:', error);
      res.status(500).json({ error: 'Internal server error.' });
  }
});


// POST /package/:id - Update a package's content by its ID
router.post('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { metadata, data } = req.body;
    if (!req.body || !metadata || !data) {
        res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.'});
        return;
    }
    const {Name, Version, Id} = metadata;
    try {
        // Fetch metadata for the given package ID from DynamoDB
        const packageData = await getPackageFromDynamoDB(id);

        if (!packageData) {
            res.status(404).json({ error: 'Package not found.' });
            return;
        }

        // Check if the package name matches
        if (packageData.name !== Name) {
             res.status(400).json({ error: 'Package name mismatch.' });
             return;
        }

        // Validate the version format (Major.Minor.Patch)
        if (!validateVersion(Version)) {
            res.status(400).json({ error: 'Invalid version format. Version must follow Major.Minor.Patch format.' });
            return;
        }

        // Validate that the patch version is uploaded sequentially
        if (packageData.version && !validatePatchVersionSequence(packageData.version, Version)) {
            res.status(400).json({ error: 'Patch version must be uploaded sequentially.' });
            return;
        }

        // Check if the package was ingested via Content or URL
        if (packageData.uploadType === 'content' && data.URL && !data.Content) {
            res.status(400).json({
                error: 'A package ingested via Content cannot be updated via URL.',
            });
            return;
        }
         // Check if the package was ingested via Content or URL
        if (packageData.uploadType === 'URL' && !data.URL && data.Content) {
          res.status(400).json({
              error: 'A package ingested via URL cannot be updated via Content.',
          });
          return;
        }
      } catch (error) {
          console.error('Error processing package update:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
    // NPM ingest
    if(data.URL && !data.Content) {
      try {

        console.info('Ingesting package (POST /package)')
        // await handleURLBasedUpload( res, data.URL, data.JSProgram);

        let url = data.URL;
  
        console.info(`req: ${JSON.stringify(data)}`);
  
        if(url.includes("github")) {
          const parts = url.split('/');
          const repositoryName = parts[parts.length - 1];
          // Constructing the npm package URL
          url = `https://www.npmjs.com/package/${repositoryName}`;
          console.info(`constructed npm package url: ${url}`);
        }
  
        const npmPackageName: string = getNPMPackageName(url);
        console.info(`package name: ${npmPackageName}`);
  
        const output = execSync(`npm view ${npmPackageName} --json --silent`, { encoding: 'utf8' }); // shell cmd to get json
        fs.writeFileSync(`${npmPackageName}_info.json`, output); // write json to file
        console.info(`wrote json file`);
        const file = `${npmPackageName}_info.json`; // file path
        const gitUrl:string = await checkNPMOpenSource(file);
        console.info(`gitUrl: ${gitUrl}`);
        let destinationPath = 'temp';
        const cloneRepoOut = await cloneRepo(gitUrl, destinationPath);
        console.info(`finished cloning`);
        const zipFilePath = await zipDirectory(cloneRepoOut[1], `./tempZip.zip`);
  
        
        let version = "";
        
        try {
          // Use fs.promises.readFile to return a Promise
          const data = await fs.promises.readFile(path.join(__dirname, './temp', 'package.json'), 'utf8');
          
          // Parse the JSON data and get the version
          const packageJson = JSON.parse(data);
          version = packageJson.version;
          console.info(`Version found: ${version}`);
        } catch (err) {
          console.error('Error reading file:', err);
        }
        
        let username: string = ""; 
        let repo: string = ""; 
        const gitInfo = await getGithubInfo(gitUrl); 
        username = gitInfo.username;
        repo = gitInfo.repo;
        console.info(`Username and repo found successfully: ${username}, ${repo}`);
        
        // Now we start the upload
        const info: RepoInfo = {
          version: version,
          url: repo
        };
        const package_version = info.version;
        console.info(`Version: ${package_version}`);
        
        const metadata: PackageMetadata = {
          Name: npmPackageName,
          Version: package_version,
          ID: generateId(npmPackageName, package_version)
        };
        
  
        const package_id = await updateDynamoPackagedata(metadata);
  
        // Check to see if package metadata was upladed to db
        if (package_id === null) { //  happens when package exists already
          console.error("Could not upload package data to db")
         
          res.status(409).send('Package exists already.');
          return;
        }
        console.debug(`ingest package to db with id: ${package_id}`)
  
        // Upload the actual package to s3
        // Read the zipped file content
        const zippedFileContent = fs.readFileSync(zipFilePath);
        const zippedDebloatContent = await debloatZippedFile(zippedFileContent)
        console.debug(`got zipped file content`)
  
        // Create Express.Multer.File object
        const zippedFile = {
            fieldname: 'file',
            originalname: 'zipped_directory.zip',
            encoding: '7bit',
            mimetype: 'application/zip',
            buffer: zippedDebloatContent // Buffer of the zipped file content
        };
  
        const s3_response = await uploadPackage(package_id, zippedFile); // Call your S3 upload function here\
  
        // Check to see if package data was uploaded to S3
        if (s3_response === null) {
          console.error("Error uploading package to S3")
         
          res.status(400).send('Could not add package data');
          return
        }
  
        // If you get to this point, the file has been successfully uploaded
        console.info(`Successfully uploaded package with id: ${package_id}`)
        await fsExtra.remove(cloneRepoOut[1]);
        console.debug(`removed clone repo`)
  
        const base64EncodedData = (zippedDebloatContent).toString('base64');
        
        let response: Package = {
          metadata: metadata,
          data: {
            Content: base64EncodedData,
            //JSProgram: req.body.JSProgram,
          },
        }
        
      
        res.status(201).json(response);
      } catch (error) {
        console.error('Could not ingest package', error);
       
        res.status(500).send('An error occurred.');
      }
  
      // zip file
    } else if(!data.URL && data.Content) {
      try {
        console.info('Uploading package (POST /package)')
  
        const binaryData = Buffer.from(data.Content, 'base64');
        console.info(`Got buffer/binary data`);
        const uploadDir = './uploads';
  
        // Create the uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir);
          console.info(`created upload directory`);
        } else {
          console.info(`upload directory exists already, no need to make it`);
        }
  
        const timestamp = Date.now(); // Use a timestamp to create a unique file name
        const zipFilePath = path.join(uploadDir, `file_${timestamp}.zip`);
        console.info(`Got zip file path: ${zipFilePath}`);
  
        // Create a writable stream to save the zip data
        const writeStream = fs.createWriteStream(zipFilePath);
        writeStream.write(binaryData, async (err: any) => {
          if (err) {
            console.info(`failed to save zip file`);
          } else {
            console.info(`zip file saved successfully`);
            
            const info = await extractRepoInfo(zipFilePath);
            const repoUrl = info.url;
            const version = info.version;
            console.info(`retrieved repo url: ${repoUrl}`);
            let username: string = ""; 
            let repo: string = ""; 
            const regex = /\/([^\/]+)\/([^\/]+)\.git$/;
            const matches = repoUrl.match(regex);
            if (matches) {
              username = matches[1]; 
              repo = matches[2]; 
            }
            console.info(`username and repo found successfully: ${username}, ${repo}`);
            let gitDetails = [{username: username, repo: repo}];
            // let scores = await get_metric_info(gitDetails);
            // console.info(`retrieved scores from score calculator: ${scores.BusFactor}, ${scores.RampUp}, ${scores.LicenseScore}, ${scores.Correctness}, ${scores.ResponsiveMaintainer}, ${scores.PullRequest}, ${scores.GoodPinningPractice}, ${scores.NetScore}`);
  
            fs.unlinkSync(zipFilePath);
            const metadata: PackageMetadata = {
              Name: repo,
              Version: version,
              ID: generateId(repo, version),
            }
  
            const package_id = await updateDynamoPackagedata(metadata);
  
            // Check to see if package metadata was upladed to db
            if (package_id === null) { //  happens when package exists already
              console.error("Could not upload package data to db")
              return res.status(409).send('Package exists already.');
            }
            console.debug(`Uploaded package to db with id: ${package_id}`)
  
            // Upload the actual package to s3
            const file = {buffer: binaryData}
            const s3_response = await uploadPackage(package_id, file);
  
            // Check to see if package data was uploaded to S3
            if (s3_response === null) {
              console.error("Error uploading package to S3")
              return res.status(400).send('Could not add package data');
            }
  
            let response: Package = {
              metadata: metadata,
              data: {
                Content: String(data.Content),
                //JSProgram: req.body.JSProgram,
              },
            }
  
            console.info(`Successfully uploaded package with id: ${package_id}`)
  
            res.status(201).json(response)
          }
          writeStream.end();
        });
      } catch (error) {
        console.error('Could not upload package', error);
       
        res.status(500).send('An error occurred.');
      }
    } else {
      // Impropper request
      res.status(400).send("There is missing field(s) in the PackageData/AuthenticationToken or it is formed improperly (e.g. Content and URL are both set), or the AuthenticationToken is invalid.")
    }
  });


// GET /package/:id/cost - Calculate cost of a package
router.get('/:id/cost', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Validate ID parameter
  if (!id || !/^[a-zA-Z0-9-]+$/.test(id)) {
      res.status(400).json({ error: 'PackageID is missing or malformed.' });
      return;
  }

  try {
      // Fetch package metadata from DynamoDB
      const packageData = await getPackageFromDynamoDB(id);
      if (!packageData) {
          res.status(404).json({ error: 'Package not found.' });
          return;
      }

      // Ensure S3 key exists for the package
      if (!packageData.s3Key) {
          res.status(500).json({ error: 'Package content key is missing.' });
          return;
      }

      // Download package content from S3
      const contentBuffer = await downloadFileFromS3(packageData.s3Key);
      const tempDir = tmp.dirSync({ unsafeCleanup: true });
      const packagePath = path.join(tempDir.name, 'package.zip');
      fs.writeFileSync(packagePath, contentBuffer);

      // Calculate the cost
      const costResult = await calculateCost(packagePath);

      // Build response structure
      const response: CostResponse = {
          [id]: {
              totalCost: costResult.totalCost / 1024, // Convert to KB
          },
      };

      // Add standaloneCost if dependencies exist
      if (costResult.hasDependencies) {
          response[id].standaloneCost = costResult.standaloneCost / 1024;
      }

      res.status(200).json(response);
      tempDir.removeCallback();
  } catch (error) {
      console.error('Error calculating package cost:', error);
      res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /package - Upload a new package
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { Content, URL, JSProgram, debloat } = req.body;

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
          await cloneRepo2(URL, tempDir);

          // Extract metadata
          metadata = extractMetadataFromRepo(tempDir);
      }

      if (!metadata) {
          res.status(400).json({ error: 'Failed to extract metadata from the repository or content.' });
          return;
      }

      const { name, version, id, url } = metadata;
      s3Key = `${id}.zip`;

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
      await uploadPackage(s3Key, {
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
        uploadType: Content ? "content" : "URL", // Ensure this matches the Module type
        packageUrl: URL || url,           // Optional field
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

// Helper function to calculate cost
const calculateCost = async (zipPath: string): Promise<CostCalculationResult> => {
  return new Promise((resolve, reject) => {
      let standaloneCost = 0;
      let totalCost = 0;
      let hasDependencies = false;

      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
          if (err) return reject(new Error('Invalid ZIP file'));

          const dependencyPromises: Promise<number>[] = [];
          zipfile.readEntry();
          zipfile.on('entry', (entry) => {
              if (/\/$/.test(entry.fileName)) {
                  zipfile.readEntry(); // Skip directories
              } else {
                  standaloneCost += entry.uncompressedSize; // Add size of current file to standaloneCost

                  if (entry.fileName.endsWith('package.json')) {
                      zipfile.openReadStream(entry, (err, readStream) => {
                          if (err) return reject(err);

                          let packageJson = '';
                          readStream.on('data', (chunk) => (packageJson += chunk));
                          readStream.on('end', async () => {
                              try {
                                  const json = JSON.parse(packageJson);
                                  const dependencies = {
                                      ...json.dependencies,
                                      ...json.devDependencies,
                                  };

                                  if (Object.keys(dependencies).length > 0) {
                                      hasDependencies = true;

                                      for (const [depName] of Object.entries(dependencies)) {
                                          dependencyPromises.push(processDependency(depName));
                                      }
                                  }

                                  zipfile.readEntry(); // Continue processing entries
                              } catch (err) {
                                  reject(err);
                              }
                          });
                      });
                  } else {
                      zipfile.readEntry(); // Continue processing entries
                  }
              }
          });

          zipfile.on('end', async () => {
              try {
                  // Wait for all dependency calculations
                  const dependencyCosts = await Promise.all(dependencyPromises);

                  // Add dependency costs to totalCost
                  const dependencyTotalCost = dependencyCosts.reduce((sum, cost) => sum + cost, 0);

                  // Total cost = standalone cost + dependencies' total cost
                  totalCost = standaloneCost + dependencyTotalCost;

                  resolve({
                    standaloneCost: parseFloat((standaloneCost / (1024 * 1024)).toFixed(6)), // Convert bytes to MB and round to 6 decimals
                    totalCost: parseFloat((totalCost / (1024 * 1024)).toFixed(6)), // Convert bytes to MB and round to 6 decimals
                    hasDependencies,
                });
              } catch (err) {
                  reject(err);
              }
          });

          zipfile.on('error', reject);
      });
  });
};


// import tar from 'tar'; // Use 'tar' to handle TAR/TGZ files

import { x } from 'tar'; // Correct named import for tar extraction

const processDependency = async (depName: string): Promise<number> => {
    try {
        // Attempt to fetch dependency metadata
        const depData = await getPackageFromDynamoDB(depName);

        let depContent: Buffer | null;

        if (depData && depData.s3Key) {
            depContent = await downloadFileFromS3(depData.s3Key);
        } else {
            // Fallback: Fetch dependency tarball from NPM
            console.warn(`Dependency ${depName} not found in database. Fetching from NPM.`);
            depContent = await fetchPackageFromNPM(depName);

            if (!depContent) {
                console.warn(`Dependency ${depName} could not be fetched from NPM.`);
                return 0; // Skip if the dependency cannot be fetched
            }
        }

        // Validate the tarball format (ZIP, TAR, or TGZ)
        const isZip = depContent.slice(0, 2).toString('hex') === '504b'; // ZIP magic number
        const isTgz = depContent.slice(0, 3).toString('hex') === '1f8b08'; // TGZ magic number

        const tempDir = tmp.dirSync({ unsafeCleanup: true });

        if (isZip) {
            // Write ZIP file to temp directory and calculate cost
            const depZipPath = path.join(tempDir.name, 'dep-package.zip');
            fs.writeFileSync(depZipPath, depContent);
            const depCost = await calculateCost(depZipPath);
            tempDir.removeCallback();
            return depCost.totalCost; // Return total cost of the dependency
        } else if (isTgz) {
            // Extract TGZ file to temp directory
            const depTgzPath = path.join(tempDir.name, 'dep-package.tgz');
            fs.writeFileSync(depTgzPath, depContent);
            const extractedPath = path.join(tempDir.name, 'extracted');
            fs.mkdirSync(extractedPath);

            await x({
                file: depTgzPath,
                cwd: extractedPath,
            });

            // Calculate cost recursively on the extracted directory
            const depCost = await calculateDirectoryCost(extractedPath);
            tempDir.removeCallback();
            return depCost;
        } else {
            console.warn(`Dependency ${depName} is not a valid ZIP or TGZ file.`);
            return 0; // Skip invalid files
        }
    } catch (error) {
        console.error(`Error processing dependency ${depName}:`, error);
        return 0; // Ignore failed dependencies
    }
};

const calculateDirectoryCost = async (directoryPath: string): Promise<number> => {
  let totalCost = 0;

  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
          // Recursively calculate cost for subdirectories
          totalCost += await calculateDirectoryCost(filePath);
      } else {
          totalCost += stats.size; // Add file size to total cost
      }
  }

  return totalCost;
};



const fetchPackageFromNPM = async (packageName: string): Promise<Buffer | null> => {
    try {
        // Fetch metadata from the NPM registry
        const response = await axios.get(`https://registry.npmjs.org/${packageName}`, { timeout: 10000 });
        const latestVersion = response.data['dist-tags'].latest;
        const tarballUrl = response.data.versions[latestVersion].dist.tarball;

        // Download the tarball
        const tarballResponse = await axios.get(tarballUrl, { responseType: 'arraybuffer', timeout: 10000 });
        return Buffer.from(tarballResponse.data); // Return the tarball content as a Buffer
    } catch (error) {
        console.error(`Error fetching package ${packageName} from NPM:`, error);
        return null; // Return null if fetching fails
    }
};
