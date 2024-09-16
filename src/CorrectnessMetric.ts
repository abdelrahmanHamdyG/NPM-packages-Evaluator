// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

import fetch from "node-fetch";
import fs from 'fs';
import path from 'path';
import * as unzipper from "unzipper";
import { exec } from 'child_process';

export class CorrectnessMetric extends Metrics {

  private zipFile:string; 
  constructor(githubData: GitHubData,npmData:NPMData) {
    super(githubData,npmData);
    this.zipFile=githubData.url+"/archive/refs/heads/master.zip";
  }

  
  public calculateScore(): number {
    this.analyze().then((res)=>{
      console.log(res);

    })
    return -1;

  }

  

  async  analyze(): Promise<number> {
    try {
      console.log("Downloading zip file...");
      await this.downloadZip();

      console.log("Unzipping file...");
      await this.unzipFile();

      console.log("Getting random files...");
      const files = this.getRandomFiles(`./${this.githubData.name}`, 3); // Adjust count as needed

      console.log("Running ESLint on files...");
      this.runESLintOnFiles(files);
    } catch (error) {
      console.error(`An error occurred with the url ${this.zipFile}:`, error);
    }
    return 0;

  }

  public calculateLatency():number{

    return -1;
  }

  private async  downloadZip() {
    const repoUrl=this.zipFile ||"empty";
    console.log(repoUrl);
    const response = await fetch(repoUrl);
    const fileStream = fs.createWriteStream(`./${this.githubData.name}.zip`);
    await new Promise<void>((resolve, reject) => {
      if(response.body){
        response.body.pipe(fileStream);
        response.body.on('error', reject);
    }
      fileStream.on('finish', resolve);
    });

  }
  
  
   getRandomFiles(dir: string, count: number): string[] {
    let files: string[] = [];
    
    function readDirRecursive(currentDir: string) {
      const dirEntries = fs.readdirSync(currentDir, { withFileTypes: true });
      dirEntries.forEach(entry => {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          readDirRecursive(fullPath);
        } else if (['.js', '.ts'].includes(path.extname(entry.name))) { // Check for .js and .ts extensions
          files.push(fullPath.replace(/\\/g, '/'));
        }
      });
    }  
    
    readDirRecursive(dir);
  
    // Shuffle files and return a limited number of files
    if (files.length <= count) {
      return files;
    }
  
    for (let i = files.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [files[i], files[j]] = [files[j], files[i]];
    }
  
    return files.slice(0, count);
  }

  private async  unzipFile( ): Promise<void> {
    await fs.createReadStream(`./${this.githubData.name}.zip`)
      .pipe(unzipper.Extract({ path: `./${this.githubData.name}` }))
      .promise();
  }
  
  runESLintOnFiles(files: string[]) {
    // Normalize the file paths
    const normalizedFiles = files.map(file => file.replace(/\\/g, '/'));
  
    console.log(normalizedFiles);
    console.log(normalizedFiles.join(" "));
  
    const eslintCommand = `npx eslint ${normalizedFiles.join(' ')}`;
  
    exec(eslintCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running ESLint: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`ESLint stderr: ${stderr}`);
        return;
      }
      console.log(`ESLint output: ${stdout}`);
    });
  }
  
  
}
// 