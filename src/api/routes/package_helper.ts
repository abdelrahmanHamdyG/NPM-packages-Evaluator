
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import AdmZip from "adm-zip";
import { minify as minifyJs } from "terser"; // JavaScript minification
import { minify as minifyHtml } from "html-minifier";
import * as tar from 'tar';
import axios from 'axios';
import archiver from 'archiver';
// Get the directory name of the current module (like __dirname in CommonJS)
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getNPMPackageName = (npmUrl: string): string  => { 
    const npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
    const npm_match = npmUrl.match(npmRegex);
    if (npm_match) { // if url is found with proper regex (package identifier)
        return npm_match[1]; // return this package name
    }
    return "";  
}
async function downloadFile(url: string, destination: string) {
    const response = await axios.get(url, { responseType: 'stream' });
    response.data.pipe(fs.createWriteStream(destination));

    await new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
    });
}
async function extractTarball(tarballPath: string, targetDir: any) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(tarballPath)
            .pipe(tar.extract({ cwd: targetDir, strip: 1 }))
            .on('error', reject)
            .on('end', resolve);
    });
}
export async function cloneRepo(repoUrl: string, destinationPath: string): Promise<[number, string]> {
    try {
        const cloneDir = path.join(__dirname, destinationPath);
        if (!fs.existsSync(cloneDir)) {
            fs.mkdirSync(cloneDir);
        }

        const tarballUrl = `${repoUrl}/archive/master.tar.gz`;
        const tarballPath = path.join(__dirname, 'temp.tar.gz');

        await downloadFile(tarballUrl, tarballPath);
        await extractTarball(tarballPath, cloneDir);

        await console.info("Tarball extracted successfully");

        //let score = await lintDirectory(cloneDir);
        let score = 1;

        fs.unlinkSync(tarballPath);
        return [score, cloneDir];
    } catch (error) {
        console.info("An error occurred when cloning the repo: ", error);
        return [0,""];
    }
}

export async function cloneRepo2(repoUrl: string, destinationPath: string): Promise<[number, string]> {
    try {
      const cloneDir = path.isAbsolute(destinationPath)
        ? destinationPath
        : path.join(__dirname, destinationPath);
  
      if (!fs.existsSync(cloneDir)) {
        fs.mkdirSync(cloneDir, { recursive: true });
      }
  
      // Fetch the default branch name dynamically
      const apiRepoUrl = repoUrl.replace('https://github.com/', 'https://api.github.com/repos/');
      const response = await axios.get(apiRepoUrl, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });
  
      const defaultBranch = response.data.default_branch || 'main'; // Use default branch or fallback to 'main'
      const tarballUrl = `${repoUrl}/archive/refs/heads/${defaultBranch}.tar.gz`;
      const tarballPath = path.join(__dirname, 'temp.tar.gz');
  
      // Download and extract the tarball
      await downloadFile(tarballUrl, tarballPath);
      await extractTarball(tarballPath, cloneDir);
  
      console.info('Tarball extracted successfully');
      const score = 1;
  
      fs.unlinkSync(tarballPath); // Cleanup temporary tarball
      return [score, cloneDir];
    } catch (error) {
      console.error('An error occurred when cloning the repo:', error);
      return [0, ''];
    }
  }

export async function zipDirectory(directoryPath: string, outputZipPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // On successful completion, resolve with the output zip file path
        output.on('close', () => {
            console.info('Directory has been zipped successfully.');
            resolve(outputZipPath); // Return the zip file path
        });

        // Handle errors during zipping
        archive.on('error', (err: any) => {
            console.error('Error zipping directory:', err);
            reject(err); // Reject the promise with the error
        });

        // Pipe the archive to the output stream
        archive.pipe(output);

        // Add the directory to the zip archive (false means no base folder in the archive)
        archive.directory(directoryPath, false);

        // Finalize the archive (this triggers the actual zipping)
        archive.finalize();
    });
}
const readJSON = (jsonPath: string, callback: (data: Record<string, unknown> | null) => void) => {
    fs.readFile(jsonPath, 'utf-8', async (err, data) => {
        if (err) {
        callback(null); // Pass null to the callback to indicate an error
        return;
        }
    
        try {
        const jsonData = JSON.parse(data);
        callback(jsonData); // Pass the parsed JSON data to the callback
        }catch (parseError) {
        callback(null); // Pass null to the callback to indicate an error
        }
    });
    };
export async function checkNPMOpenSource(filePath: string): Promise<string> {
    return new Promise((resolve) => {
        readJSON(filePath, async (jsonData) => {
        if (jsonData != null) {
            console.info(`reading json (not null)...`);
            const repository = jsonData.repository as Record<string, unknown>;
            if (repository.type == 'git') {
                console.info(`repo is git`);
                let gitUrl: string = repository.url as string;
                if (gitUrl.startsWith('git+ssh://git@')) {
                    // Convert SSH URL to HTTPS URL
                    gitUrl = gitUrl.replace('git+ssh://git@', 'https://');
                } else if (gitUrl.startsWith('git+https://')) {
                    gitUrl = gitUrl.replace('git+https://', 'https://');
                } else if (gitUrl.startsWith('git')) {
                    gitUrl = gitUrl.replace('git', 'https');
                }

                if (gitUrl.endsWith('.git')) { 
                    gitUrl = gitUrl.substring(0, gitUrl.length - 4);
                }
                    
                console.info(`made gitUrl: ${gitUrl}`);
                resolve(gitUrl);
            } else {
                console.info('No git repository found.');
                resolve("Invalid");
            }
        } else {
            console.info('Failed to read or parse JSON.');
            return "";
        }
        });

    });
}

export const getGithubInfo = (gitUrl: string): { username: string, repo: string}  => {
    const gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
    const gitMatch = gitUrl.match(gitRegex);
    if (gitMatch) { 
        return {
            username: gitMatch[1],
            repo: gitMatch[2]
        };
    }
    return {
        username: "",
        repo: ""
    };
}
export function generateId(name: string, version: string) {
    return name + version
}
export async function debloatZippedFile(zippedData: Buffer): Promise<Buffer> {
    const zip = new AdmZip(zippedData);
    const entries = zip.getEntries();
    const cleanedZip = new AdmZip();
  
    for (const entry of entries) {
      if (entry.isDirectory) {
        console.debug(`Skipping directory: ${entry.entryName}`);
        continue; // Skip directories entirely
      }
  
      const fileName = entry.entryName;
      const fileContent = entry.getData().toString();
  
      // Remove unnecessary files
      if (
        fileName.endsWith(".md") || // Remove markdown files
        fileName.startsWith("test/") || // Remove test files
        fileName.endsWith(".log") // Remove log files
      ) {
        console.debug(`Excluding unnecessary file: ${fileName}`);
        continue; // Skip adding this file
      }
  
      let optimizedContent: Buffer = entry.getData(); // Default to original content
  
      // Minify JavaScript files
      if (fileName.endsWith(".js")) {
        try {
          const result = await minifyJs(fileContent);
          if (result.code) {
            optimizedContent = Buffer.from(result.code);
          }
        } catch (error) {
          console.error(`Failed to minify JavaScript file: ${fileName}`, error);
        }
      }
  
      // Minify HTML files
      if (fileName.endsWith(".html")) {
        try {
          const minified = minifyHtml(fileContent, {
            collapseWhitespace: true,
            removeComments: true,
            minifyJS: true, // Will minify embedded JS within HTML
          });
          optimizedContent = Buffer.from(minified);
        } catch (error) {
          console.error(`Failed to minify HTML file: ${fileName}`, error);
        }
      }
  
      // Add the optimized or original file to the new zip
      cleanedZip.addFile(fileName, optimizedContent);
    }
  
    // Return the debloated zip as a buffer
    return cleanedZip.toBuffer();
  }