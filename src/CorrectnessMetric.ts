/* eslint-disable no-console */
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import git, { ReadCommitResult } from "isomorphic-git";
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

  async countTotalLinesFilesAndTests(dir: string): Promise<{
    totalLines: number;
    totalFiles: number;
    testFileCount: number;
    testLineCount: number;
  }> {
    const files = await fs.promises.readdir(dir, { withFileTypes: true });
  
    if (!files || files.length === 0) {
      return {
        totalLines: 0,
        totalFiles: 0,
        testFileCount: 0,
        testLineCount: 0,
      };
    }
  
    const results = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file.name);
        console.log(filePath);
  
        if (file.isDirectory()) {
          // Recursively process the subdirectory
          return this.countTotalLinesFilesAndTests(filePath);
        } else {
          // Process the file
          const data = await fs.promises.readFile(filePath, "utf-8");
          const lines = data.split("\n").length;
          const isTestFile =
            /\.(test|spec)\.(js|ts)$/.test(file.name) ||
            /tests|__tests__|test/.test(filePath);
  
          return {
            totalLines: lines,
            totalFiles: 1,
            testFileCount: isTestFile ? 1 : 0,
            testLineCount: isTestFile ? lines : 0,
          };
        }
      })
    );
  
    // Aggregate the results
    const totalLines = results.reduce((sum, res) => sum + res.totalLines, 0);
    const totalFiles = results.reduce((sum, res) => sum + res.totalFiles, 0);
    const testFileCount = results.reduce((sum, res) => sum + res.testFileCount, 0);
    const testLineCount = results.reduce((sum, res) => sum + res.testLineCount, 0);
  
    return {
      totalLines,
      totalFiles,
      testFileCount,
      testLineCount,
    };
  }
  cloneRepo(): Promise<void> {
    const repoName = this.githubData.name;

    return git.clone({
      fs,
      http,
      dir: repoName as string,
      url: this.githubData?.url as string,
      singleBranch: true,
      depth: 21,
    }).then(() => {
      console.log(`Repository cloned successfully to ${repoName}`);
    }).catch(error => {
      console.error("Error cloning repository:", error);
    });
  }

  public calculateScore(): Promise<number> {
    const repoDir1 = `${this.githubData.name}`; // Directory for the latest commit
    if (repoDir1 === "empty") {
      return Promise.resolve(0);
    }

    let latestCommitResults: 
    { testfileCount: number; testlineCount: number; fileCount: number; lineCount: number };  
    let commit20AgoResults:
    { testfileCount: number; testlineCount: number; fileCount: number; lineCount: number };

    return this.cloneRepo()
      .then(() => this.countTotalLinesFilesAndTests(repoDir1))
      .then(result1 => {
        latestCommitResults = {
          testfileCount: result1.testFileCount,
          testlineCount: result1.testLineCount,
          fileCount: result1.totalFiles,
          lineCount: result1.totalLines
        };
      })
      .then(() => this.getCommit20Ago(repoDir1))
      .then(commit20Ago => this.checkoutCommit(repoDir1, commit20Ago.oid))
      .then(() => this.countTotalLinesFilesAndTests(repoDir1))
      .then(result2 => {
        commit20AgoResults = {
          testfileCount: result2.testFileCount,
          testlineCount: result2.testLineCount,
          fileCount: result2.totalFiles,
          lineCount: result2.totalLines
        };

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

        const filediffCountScore = Math.max(0, Math.
          min(1, testFileCountDifference / FileCountDifference));
        const linediffCountScore = Math.max(
          0, Math.min(1, testLineCountDifference / LineCountDifference));
        const fileCountScore = Math.max(0, Math.min(1, latestTestFileCount / latestFileCount));
        const lineCountScore = Math.max(0, Math.min(1, latestTestLineCount / latestLineCount));
          console.log(latestTestFileCount);
          console.log(firstTestFileCount);
        // Calculate the final correctness score (weighted average)
        const correctnessScore = 
        Math.min(1, Math.max(fileCountScore, lineCountScore) 
        + 0.5 * filediffCountScore + 0.5 * linediffCountScore+0.00005*(this
          .githubData.numberOfStars||0));

        console.log(`Correctness score is ${correctnessScore}\n`);
        return correctnessScore;
      })
      .then(correctnessScore => {
        return fs.remove(repoDir1).then(() => {
          console.log("Folder removed successfully");
          return correctnessScore;
        });
      })
      .catch(error => {
        console.error("Error calculating score:", error);
        return 0; // Return 0 if there is an error
      });
  }

  async getLatestCommit(dir: string): Promise<ReadCommitResult> {
    const commits = await git.log({ fs, dir, depth: 1 });
    return commits[0];
  }

  async getCommit20Ago(dir: string): Promise<ReadCommitResult> {
    const commits = await git.log({ fs, dir, depth: 21 });
    return commits[commits.length - 1];
  }

  analyze(): Promise<number> {
    return Promise.resolve(0);
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    const start=performance.now();

    const score=await this.calculateScore();
    const end=performance.now();

    return {score,latency:end-start};
  }

  checkoutCommit(dir: string, oid: string): Promise<void> {
    return git.checkout({
      fs,
      dir,
      ref: oid,  
    });
  }
}
