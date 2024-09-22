/* eslint-disable no-console */
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import git, { ReadCommitResult } from "isomorphic-git";
import fs from "fs-extra";
import path from "path";
import http from "isomorphic-git/http/node/index.js";
import { Logger } from "./logger.js";

export class CorrectnessMetric extends Metrics {
  private logger: Logger;

  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    this.logger = new Logger();
  }

  countLinesInFile(filePath: string): Promise<number> {
    return fs.promises.readFile(filePath, "utf-8").then((data) => {
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

    this.logger.log(1, `Cloning repository: ${this.githubData?.url}`);
    return git.clone({
      fs,
      http,
      dir: repoName as string,
      url: this.githubData?.url as string,
      singleBranch: true,
      depth: 21,
    })
    .then(() => {
      this.logger.log(1, `Repository cloned successfully to ${repoName}`);
    })
    .catch((error) => {
      this.logger.log(1, `Error cloning repository: ${error}`);
    });
  }

  public async calculateScore(): Promise<number> {
    const repoDir1 = `${this.githubData.name}`; // Directory for the latest commit
    if (repoDir1 === "empty") {
      this.logger.log(1, "Repository is empty. Cannot calculate score.");
      return -1;
    }

    let latestCommitResults: {
      testfileCount: number;
      testlineCount: number;
      fileCount: number;
      lineCount: number;
    };  
    let commit20AgoResults: {
      testfileCount: number;
      testlineCount: number;
      fileCount: number;
      lineCount: number;
    };

    try {
      // Clone the repository
      await this.cloneRepo();

      // Count lines and files for the latest commit
      this.logger.log(1, "Counting lines and files for the latest commit...");
      latestCommitResults = await this.countTotalLinesFilesAndTests(repoDir1);

      // Get the commit that is 20 commits ago
      this.logger.log(2, "Retrieving commit 20 commits ago...");
      const commit20Ago = await this.getCommit20Ago(repoDir1);

      // Checkout to the commit 20 commits ago and count lines and files
      this.logger.log(1, `Checking out to commit ${commit20Ago.oid}...`);
      await this.checkoutCommit(repoDir1, commit20Ago.oid);
      commit20AgoResults = await this.countTotalLinesFilesAndTests(repoDir1);

      // Calculate differences and correctness score
      const latestFileCount = latestCommitResults.fileCount;
      const latestLineCount = latestCommitResults.lineCount;
      const firstFileCount = commit20AgoResults.fileCount;
      const firstLineCount = commit20AgoResults.lineCount;
      const latestTestFileCount = latestCommitResults.testfileCount;
      const latestTestLineCount = latestCommitResults.testlineCount;
      const firstTestFileCount = commit20AgoResults.testfileCount;
      const firstTestLineCount = commit20AgoResults.testlineCount;

      const testFileCountDifference = Math.abs(
        latestTestFileCount - firstTestFileCount
      );
      const testLineCountDifference = Math.abs(
        latestTestLineCount - firstTestLineCount
      );
      const fileCountDifference = Math.abs(latestFileCount - firstFileCount);
      const lineCountDifference = Math.abs(latestLineCount - firstLineCount);

      const fileDiffCountScore = Math.max(
        0,
        Math.min(1, testFileCountDifference / fileCountDifference)
      );
      const lineDiffCountScore = Math.max(
        0,
        Math.min(1, testLineCountDifference / lineCountDifference)
      );

      const fileCountScore = Math.max(
        0,
        Math.min(1, latestTestFileCount / latestFileCount)
      );
      const lineCountScore = Math.max(
        0,
        Math.min(1, latestTestLineCount / latestLineCount)
      );

      // Calculate the final correctness score (weighted average)
      const correctnessScore = Math.min(
        1,
        Math.max(fileCountScore, lineCountScore) +
        0.5 * fileDiffCountScore +
        0.5 * lineDiffCountScore +
        0.00005 * (this.githubData.numberOfStars || 0)
      );

      this.logger.log(1, `Correctness score is ${correctnessScore}`);

      // Remove the cloned repo directory
      await fs.remove(repoDir1);
      this.logger.log(1, "Repository folder removed successfully");

      return correctnessScore;
    } catch (error) {
      this.logger.log(1, `Error calculating score: ${error}`);

      // Remove the repo directory if there's an error
      await fs.remove(repoDir1);
      return -1;
    }
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
    this.logger.log(1, "Measuring latency for score calculation...");

    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();

    const latency = end - start;
    this.logger.log(1, `Score Calculation Latency: ${latency} ms`);

    return { score, latency };
  }

  checkoutCommit(dir: string, oid: string): Promise<void> {
    return git.checkout({
      fs,
      dir,
      ref: oid,
    });
  }
}
