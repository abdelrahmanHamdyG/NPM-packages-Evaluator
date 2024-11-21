import { Router, Request, Response } from 'express';
import { getPackageFromDynamoDB, updateDynamoPackagedata } from '../services/dynamoservice.js';
import { downloadFileFromS3,uploadPackage} from '../services/s3service.js';
import {getNPMPackageName, checkNPMOpenSource,debloatZippedFile, getGithubInfo, cloneRepo, zipDirectory, generateId} from '../routes/package_helper.js'
import * as fsExtra from 'fs-extra';
import { execSync } from 'child_process';
import * as path from 'path';
import { CLI } from "../../phase-1/CLI.js";
import * as fs from 'fs';
import * as tmp from 'tmp';
const yauzl = require('yauzl');

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

// POST /package/:id - Update a package's content by its ID
router.post('/:id', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const authenticationToken = req.header('X-Authorization');
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
      
        // Now we start the upload
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
          return;
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
    } else if(!req.body.URL && req.body.Content) {
      try {
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
              res.status(409).send('Package exists already.');
              return;
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


export default router;