/* eslint-disable no-console */
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import git,{ReadCommitResult} from "isomorphic-git";
import fs from "fs-extra";
import path from "path";
import http from "isomorphic-git/http/node/index.js";


export class CorrectnessMetric extends Metrics {
  
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
  }

  countLinesInFile(filePath: string): Promise<number> {
    return fs.promises.readFile(filePath, "utf-8").then(data => {
      const lines = data.split("\n");
      return lines.length;
    });
  }

  async countTotalLinesFilesAndTests  (dir: string): Promise<{
    totalLines: number,
    totalFiles: number,
    testFileCount: number,
    testLineCount: number
  }>  {
    let totalLinesOfCode = 0;
    let totalFilesCount = 0;
    let testFileCount = 0;
    let testLineCount = 0;

    return fs.promises.readdir(dir, { withFileTypes: true }).then(files => {
      const promises = files.map(file => {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
          return this.countTotalLinesFilesAndTests(filePath).then(result => {
            totalLinesOfCode += result.totalLines;
            totalFilesCount += result.totalFiles;
            testFileCount += result.testFileCount;
            testLineCount += result.testLineCount;
          });
        } else {
          totalFilesCount += 1; // Increment the file count

          return fs.promises.readFile(filePath, "utf-8").then(data => {
            const lines = data.split("\n").length;
            totalLinesOfCode += lines;

            // Check if the file is a test file (by convention: test, spec, etc.)
            if (/\.(test|spec)\.(js|ts)$/.test(file
              .name) || /tests|__tests__|test/.test(filePath)) {

              testFileCount += 1; // Increment test file count
              testLineCount += lines; // Add test lines count
            }
          });
        }
      });

      return Promise.all(promises).then(() => ({
        totalLines: totalLinesOfCode,
        totalFiles: totalFilesCount,
        testFileCount: testFileCount,
        testLineCount: testLineCount
      }));
    });
  };

  cloneRepo(): Promise<void> {
    const repoName = this.githubData.name;

    return git.clone({
      fs,
      http,
      dir: repoName as string,
      url: this.githubData?.url as string,
      singleBranch: true,
      depth:21,
    }).then(() => {
      console.log(`Repository cloned successfully to ${repoName}`);
    }).catch(error => {
      console.error("Error cloning repository:", error);
    });
  }

  
  public calculateScore2(): void {
    const repoDir1 = `${this.githubData.name}`; // Directory for the latest commit
    if(repoDir1==="empty"){

      return ;

    }
    let latestCommitResults: 
    { testfileCount: number; testlineCount: number; fileCount: number; lineCount: number };  
    let commit20AgoResults:
     { testfileCount: number; testlineCount: number; fileCount: number; lineCount: number }; 
  
    // Clone the repository and proceed with file analysis
    this.cloneRepo()
      .then(() => {
        // First, find test files and count lines in the current (latest) commit
        return this.countTotalLinesFilesAndTests(repoDir1).then(result1 => {
          latestCommitResults = {
            testfileCount: result1.testFileCount,
            testlineCount: result1.testLineCount,
            fileCount: result1.totalFiles,
            lineCount: result1.totalLines
          };        });
      })
      .then(() => {
        // Get the commit that is 20 commits ago
        return this.getCommit20Ago(repoDir1);
      })
      .then(commit20Ago => {
        
        return this.checkoutCommit(repoDir1, commit20Ago.oid)
          .then(() => {
            
            return this.countTotalLinesFilesAndTests(repoDir1).then(result2 => {
              commit20AgoResults = {
                testfileCount: result2.testFileCount,
            testlineCount: result2.testLineCount,
            fileCount: result2.totalFiles,
            lineCount: result2.totalLines
              };            });
          });
      })
      .then(() => {
        
        //const maxLineCountDifference = 0.3 * latestCommitResults.lineCount;
        //const maxFileCountDifference = 0.3 * latestCommitResults.fileCount; 
        const latestFileCount = latestCommitResults.fileCount;
        const latestLineCount = latestCommitResults.lineCount;
        const firstFileCount = commit20AgoResults.fileCount;
        const firstLineCount = commit20AgoResults.lineCount;
        const latestTestFileCount = latestCommitResults.testfileCount;
        const latestTestLineCount = latestCommitResults.testlineCount;
        const firstTestFileCount = commit20AgoResults.testfileCount;
        const firstTestLineCount = commit20AgoResults.testlineCount;

        const testFileCountDifference = Math.abs(latestTestFileCount - firstTestFileCount);
        const testLineCountDifference = Math.abs(latestTestLineCount - firstTestLineCount);
        const FileCountDifference = Math.abs(latestFileCount - firstFileCount);
        const LineCountDifference = Math.abs(latestLineCount - firstLineCount);


        const filediffCountScore = 
        Math.max(0, Math.min(1, testFileCountDifference / FileCountDifference));

        const linediffCountScore = 
        Math.max(0, Math.min(1, testLineCountDifference / LineCountDifference));

        const fileCountScore = 
        Math.max(0, Math.min(1, latestTestFileCount / latestFileCount));

        const lineCountScore = 
        Math.max(0, Math.min(1, latestTestLineCount/ latestLineCount));

        console.log(`${this.githubData.name}`);
        console.log(`all file before ${firstFileCount} and all file after ${latestFileCount}`);
        console.log(`all lines before ${firstLineCount} and all lines after ${latestLineCount}`);
        console.log(`all test lines before
           ${firstTestLineCount} and alltest lines after ${latestTestLineCount}`);
           console.log(`all test files before
            ${firstTestFileCount} and all test files after ${latestTestFileCount}`);
        // Calculate the final correctness score (weighted average)
        const correctnessScore =Math.min(1, 
         Math.max (fileCountScore, lineCountScore) +
        0.5 * filediffCountScore + 0.5 * linediffCountScore);

        console.log(`Correctness score is ${correctnessScore}\n`);


      }).then(()=>{

        return fs.remove(repoDir1).then(()=>{

            console.log("folder  removed succesfully ");

        });

      })
      .catch((error) => {
        console.error("Error calculating score:", error);
      });
  }
  


  

  async getLatestCommit(dir: string): Promise<ReadCommitResult> {
    const commits = await git.log({ fs, dir, depth: 1 });
    return commits[0];
  }

  
  async getCommit20Ago(dir: string): Promise<ReadCommitResult> {
    const commits = await git.log({ fs, dir, depth: 21 });
    return commits[commits.length-1];
  }

  analyze(): Promise<number> {
    return Promise.resolve(0);
  }

  calculateLatency(): number {
    return -1;
  }
  checkoutCommit(dir: string, oid: string): Promise<void> {
    return git.checkout({
      fs,
      dir,
      ref: oid,  
    });
  }
  
}
