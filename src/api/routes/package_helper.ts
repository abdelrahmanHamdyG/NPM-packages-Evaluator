
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

export function generateId(name: string, version: string) {
    return name + version
}
