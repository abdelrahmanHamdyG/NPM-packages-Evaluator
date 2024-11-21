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
import yauzl from 'yauzl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const cli = new CLI();
interface Module {
    id: string;
    name: string;
    version: string;
    s3Key: string;
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

function extractRepoInfo(zipFilePath: string): Promise<RepoInfo> {
  return new Promise((resolve, reject) => {
      let foundPackageJson = false;

      yauzl.open(zipFilePath, { lazyEntries: true }, (err: Error | null, zipfile: any | null) => {
          if (err || !zipfile) {
              reject(err || new Error('Unable to open zip file'));
              return;
          }

          zipfile.on('entry', (entry: any) => {
              console.info(`Processing entry: ${entry.fileName}`);
              if (/\/?package\.json$/.test(entry.fileName)) {
                  foundPackageJson = true;
                  zipfile.openReadStream(entry, (err: Error | null, readStream: NodeJS.ReadableStream | null) => {
                      if (err || !readStream) {
                          reject(err || new Error('Unable to read package.json'));
                          return;
                      }

                      let fileContent = '';
                      readStream.on('data', (data: Buffer) => {
                          fileContent += data;
                      });

                      readStream.on('end', () => {
                          try {
                              const jsonObject = JSON.parse(fileContent);
                              resolve({
                                  version: jsonObject.version || '1.0.0',
                                  url: jsonObject.repository?.url || 'https://unknown',
                              });
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
              if (!foundPackageJson) {
                  reject(new Error('package.json not found in the zip'));
              }
          });

          zipfile.readEntry();
      });
  });
}

// PUT /package/:id - Update a package's content by its ID
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  //TODO: if db succeeds to upload but S3 fails, remove the corresponding db entry
    const authenticationToken = req.get('X-Authorization');
    console.info(`XAuth: ${authenticationToken}`)
    if(!authenticationToken) {
      res.status(400).json('Auth not given');
      return 
    }
    let JSProgram: string | null;
    if(req.body.JSProgram === undefined) {
      JSProgram = null;
    } else {
      JSProgram = req.body.JSProgram;
    }
  
    // NPM ingest
    if(req.body.URL && !req.body.Content) {
      try {
        console.info('Ingesting package (POST /package)')
  
        let url = req.body.URL;
  
        console.info(`req: ${JSON.stringify(req.body)}`);
  
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
        fs.writeFileSync(`./temp_npm_json/${npmPackageName}_info.json`, output); // write json to file
        console.info(`wrote json file`);
        const file = `./temp_npm_json/${npmPackageName}_info.json`; // file path
        const gitUrl:string = await checkNPMOpenSource(file);
        console.info(`gitUrl: ${gitUrl}`);
        let destinationPath = 'temp_linter_test';
        const cloneRepoOut = await cloneRepo(gitUrl, destinationPath);
        console.info(`finished cloning`);
        const zipFilePath = await zipDirectory(cloneRepoOut[1], `./tempZip.zip`);
  
        let version = "";
        fs.readFile(path.join('./src/assets/temp_linter_test', 'package.json'), 'utf8', async (err : any, data : any) => {
          if (err) {
            console.error('Error reading file:', err);
            return;
          }
        
          try {
            const packageJson = JSON.parse(data);
            version = packageJson.version;
            console.info(`version found: ${version}`);
          } catch (error) {
            console.info(`error searching version: ${error}`);
          }
        });
  
        let username: string = ""; 
        let repo: string = ""; 
        const gitInfo = getGithubInfo(gitUrl);
        username = gitInfo.username;
        repo = gitInfo.repo;
        console.info(`username and repo found successfully: ${username}, ${repo}`);
        let gitDetails = [{username: username, repo: repo}];
        // let scores = await get_metric_info(gitDetails);
        // //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
        // console.info(`retrieved scores from score calculator: ${scores.BusFactor}, ${scores.RampUp}, ${scores.LicenseScore}, ${scores.Correctness}, ${scores.ResponsiveMaintainer}, ${scores.PullRequest}, ${scores.GoodPinningPractice}, ${scores.NetScore}`);
        
        // // We check if the rating is sufficient and return if it is not
        // if(scores.NetScore < 0.5) {
        //   console.info(`Upload aborted, insufficient rating of ${scores.NetScore}`);
        //   res.status(424).send("Package is not uploaded due to the disqualified rating.");
        // }
  
        // Now we start the upload
        //TODO: add in the support for different versions
        const info : RepoInfo = {
          version: version,
          url: repo
        }
        const package_version = info.version;
        const metadata: PackageMetadata = {
          Name: npmPackageName,
          Version: package_version,
          ID: generateId(npmPackageName, package_version)
        }
  
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
        console.debug(`got zipped file content`)
  
        // Create Express.Multer.File object
        const zippedFile = {
            fieldname: 'file',
            originalname: 'zipped_directory.zip',
            encoding: '7bit',
            mimetype: 'application/zip',
            buffer: zippedFileContent // Buffer of the zipped file content
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
  
        const base64EncodedData = (zippedFileContent).toString('base64');
        
        let response: Package = {
          metadata: metadata,
          data: {
            Content: base64EncodedData,
            //JSProgram: req.body.JSProgram,
          },
        }
        
        // Old return value
        //{"metadata": {"Name": repo, "Version": "Not Implementing", "ID": package_id}, "data": {"Content": zippedFile.buffer, "JSProgram": "Not Implementing"}};
        
        res.status(201).json(response);
      } catch (error) {
        console.error('Could not ingest package', error);
       
        res.status(500).send('An error occurred.');
      }
  
      // zip file
    } else if(!req.body.URL && req.body.Content) {
      try {
        console.info("\n-----------------------------------------");
        console.info('Uploading package (POST /package)')
  
        const binaryData = Buffer.from(req.body.Content, 'base64');
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
            // //let scores = {BusFactor: 1, RampUp: 1, LicenseScore: 1, Correctness: 1, ResponsiveMaintainer: 1, PullRequest: 1, GoodPinningPractice: 1, NetScore: 1};
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
                Content: String(req.body.Content),
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

// POST /package - Upload a new package
// POST /package - Upload a new package
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const authToken = req.header('X-Authorization');
  const { Content, URL, JSProgram, debloat } = req.body;

  if (!authToken) {
      res.status(403).json({ error: 'Authentication token is missing.' });
      return;
  }

  if (!Content && !URL) {
      res.status(400).json({ error: 'URL or Content is required for this operation.' });
      return;
  }

  if (Content && URL) {
      res.status(400).json({ error: 'URL and Content cannot both be set.' });
      return;
  }

  try {
      let metadata;
      const tempDir = tmp.dirSync({ unsafeCleanup: true }).name;

      if (Content) {
          const zipBuffer = Buffer.from(Content, 'base64');
          const zip = new AdmZip(zipBuffer);
          zip.extractAllTo(tempDir, true);

          // Extract metadata from extracted content
          metadata = extractMetadataFromRepo(tempDir);
      } else if (URL) {
          await cloneRepo(URL, tempDir);
          metadata = extractMetadataFromRepo(tempDir);
      }

      if (!metadata) {
          res.status(400).json({ error: 'Failed to extract metadata from the repository or uploaded content.' });
          return;
      }

      const { name, version, id } = metadata;

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

      const s3Key = `packages/${id}.zip`;

      // Recreate ZIP buffer
      const zip = new AdmZip();
      zip.addLocalFolder(tempDir);
      const zipBuffer = zip.toBuffer();

      // Upload to S3
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
          packageUrl: URL || null,
          createdAt: new Date().toISOString(),
          jsProgram: JSProgram || null,
          debloat: debloat || false,
      };

      await addModuleToDynamoDB(packageData);

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

  
  /**
   * Handles Content-based package upload by using the repository name and default version.
   */
  async function handleContentBasedUpload(
    req: Request,
    res: Response,
    authToken: string,
    Content: string,
    JSProgram?: string
  ): Promise<void> {
    try {
      const tempDir = tmp.dirSync().name; // Create a temporary directory for extraction
      const zipFilePath = path.join(tempDir, 'temp.zip');
      fs.writeFileSync(zipFilePath, Buffer.from(Content, 'base64')); // Decode and save the zip file
  
      // Extract repo information from the package.json file inside the zip
      const repoInfo = await extractRepoInfo(zipFilePath);
  
      // If repoInfo extraction fails, return an error
      if (!repoInfo || !repoInfo.url) {
        res.status(400).json({ error: 'Could not extract repository information from the package content.' });
        return;
      }
  
      // Use the repo name and default version for the package
      const packageName = getGithubInfo(repoInfo.url).repo || 'UnknownRepo';
      const version = repoInfo.version || '1.0.0';
      const packageId = generateId(packageName, version);
  
      // Upload the content to S3
      const s3Response = await uploadPackage(packageId, {
        buffer: Buffer.from(Content, 'base64'),
        mimetype: 'application/zip',
      });
  
      if (!s3Response) {
        res.status(500).json({ error: 'Failed to upload package content to S3.' });
        return;
      }
  
      // Save metadata to DynamoDB
      const metadata = {
        Name: packageName,
        Version: version,
        ID: packageId,
      };
  
      const dbResponse = await updateDynamoPackagedata(metadata);
      if (!dbResponse) {
        res.status(409).json({ error: 'Package already exists or failed to save metadata.' });
        return;
      }
  
      // Prepare the response
      res.status(201).json({
        metadata,
        data: { Content, JSProgram: JSProgram || null },
      });
  
      // Cleanup temporary directory
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error handling Content-based upload:', error);
      throw error;
    }
  }
  
  /**
   * Handles URL-based package upload (unchanged from previous logic).
   */
  async function handleURLBasedUpload(
    req: Request,
    res: Response,
    authToken: string,
    URL: string,
    JSProgram?: string
  ): Promise<void> {
    try {
      let gitUrl = URL;
  
      // Check if the URL is a GitHub repository
      if (URL.includes("github.com")) {
        // Extract GitHub information directly
        console.info("Processing GitHub repository URL.");
      } else {
        // Assume it's an npm package URL
        const npmPackageName = getNPMPackageName(URL);
        if (!npmPackageName) {
          res.status(400).json({ error: 'Invalid URL or unsupported repository.' });
          return;
        }
  
        // Retrieve the Git URL from the npm package metadata
        gitUrl = await checkNPMOpenSource(npmPackageName);
        if (gitUrl === 'Invalid') {
          res.status(400).json({ error: 'Package repository is not open source or unsupported.' });
          return;
        }
      }
  
      // Clone the repository
      const cloneDir = tmp.dirSync().name; // Temporary directory for cloning
      const [cloneResult, cloneDirPath] = await cloneRepo(gitUrl, cloneDir);
      if (cloneResult === 0) {
        res.status(500).json({ error: 'Failed to clone repository.' });
        return;
      }
  
      // Create a zip file of the cloned repository
      const zipFilePath = tmp.fileSync({ postfix: '.zip' }).name;
      await zipDirectory(cloneDirPath, zipFilePath);
  
      // Read package.json for metadata
      const packageJsonPath = path.join(cloneDirPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        res.status(400).json({ error: 'package.json not found in the repository.' });
        return;
      }
  
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const npmPackageName = packageJson.name || 'UnknownPackage';
      const version = packageJson.version || '1.0.0';
  
      // Create metadata
      const metadata = {
        Name: npmPackageName,
        Version: version,
        ID: generateId(npmPackageName, version),
      };
  
      // Upload the zip file to S3
      const s3Response = await uploadPackage(metadata.ID, {
        buffer: fs.readFileSync(zipFilePath),
        mimetype: 'application/zip',
      });
  
      if (!s3Response) {
        res.status(500).json({ error: 'Failed to upload package content to S3.' });
        return;
      }
  
      // Save metadata to DynamoDB
      const dbResponse = await updateDynamoPackagedata(metadata);
      if (!dbResponse) {
        res.status(409).json({ error: 'Package already exists or failed to save metadata.' });
        return;
      }
  
      // Respond with success
      res.status(201).json({
        metadata,
        data: { Content: fs.readFileSync(zipFilePath).toString('base64'), JSProgram: JSProgram || null },
      });
  
      // Cleanup temporary files and directories
      fs.rmSync(cloneDirPath, { recursive: true });
      fs.unlinkSync(zipFilePath);
    } catch (error) {
      console.error('Error handling URL-based upload:', error);
      throw error;
    }
  }
  
  export default router;