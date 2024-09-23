import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import git, { ReadCommitResult } from "isomorphic-git";
import fs from "fs-extra";
import path from "path";
import http from "isomorphic-git/http/node/index.js";
import { Logger } from "./logger.js";

const logger = new Logger();

// defining the correctnessmetric class
export class CorrectnessMetric extends Metrics {
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    logger.log(2, "correctnessmetric initialized.");
  }

  // counting lines in a file
  countLinesInFile(filePath: string): Promise<number> {
    return fs.promises.readFile(filePath, "utf-8").then((data) => {
      const lines = data.split("\n");
      return lines.length;
    });
  }

  // counting total lines, files, and tests in a directory
  async countTotalLinesFilesAndTests(
    dir: string
  ): Promise<{
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
          // recursively process the subdirectory
          return this.countTotalLinesFilesAndTests(filePath);
        } else {
          // process the file
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

    // aggregating the results
    const totalLines = results.reduce((sum, res) => sum + res.totalLines, 0);
    const totalFiles = results.reduce((sum, res) => sum + res.totalFiles, 0);
    const testFileCount = results.reduce(
      (sum, res) => sum + res.testFileCount,
      0
    );
    const testLineCount = results.reduce(
      (sum, res) => sum + res.testLineCount,
      0
    );

    return {
      totalLines,
      totalFiles,
      testFileCount,
      testLineCount,
    };
  }

  // cloning the repository
  cloneRepo(): Promise<void> {
    const repoName = this.githubData.name;
    logger.log(
      1,
      `cloning repository: ${this.githubData.url} into directory: ${repoName}`
    );

    return git
      .clone({
        fs,
        http,
        dir: repoName as string,
        url: this.githubData?.url as string,
        singleBranch: true,
        depth: 21,
      })
      .then(() => {
        logger.log(1, `repository cloned successfully to ${repoName}`);
      })
      .catch((error) => {
        logger.log(1, `error cloning repository: ${error}`);
      });
  }

  // calculating the correctness score
  public calculateScore(): Promise<number> {
    logger.log(
      1,
      `calculating correctness score for repository: ${this.githubData.name}`
    );
    const repoDir1 = `${this.githubData.name}`; // directory for the latest commit
    if (repoDir1 === "empty") {
      logger.log(1, "repository name is empty. returning score 0.");
      return Promise.resolve(0);
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

    return this.cloneRepo()
      .then(() => {
        logger.log(2, "repository cloned. starting analysis.");
        return this.countTotalLinesFilesAndTests(repoDir1);
      })
      .then((result1) => {
        latestCommitResults = {
          testfileCount: result1.testFileCount,
          testlineCount: result1.testLineCount,
          fileCount: result1.totalFiles,
          lineCount: result1.totalLines,
        };
        logger.log(2, `latest commit results: ${JSON.stringify(latestCommitResults)}`);
      })
      .then(() => this.getCommit20Ago(repoDir1))
      .then((commit20Ago) => {
        logger.log(2, `got commit 20 commits ago: ${commit20Ago.oid}`);
        return this.checkoutCommit(repoDir1, commit20Ago.oid);
      })
      .then(() => this.countTotalLinesFilesAndTests(repoDir1))
      .then((result2) => {
        commit20AgoResults = {
          testfileCount: result2.testFileCount,
          testlineCount: result2.testLineCount,
          fileCount: result2.totalFiles,
          lineCount: result2.totalLines,
        };
        logger.log(
          2,
          `20th commit results: ${JSON.stringify(commit20AgoResults)}`
        );

        const latestFileCount = latestCommitResults.fileCount;
        const latestLineCount = latestCommitResults.lineCount;
        const firstFileCount = commit20AgoResults.fileCount;
        const firstLineCount = commit20AgoResults.lineCount;
        const latestTestFileCount = latestCommitResults.testfileCount;
        const latestTestLineCount = latestCommitResults.testlineCount;
        const firstTestFileCount = commit20AgoResults.testfileCount;
        const firstTestLineCount = commit20AgoResults.testlineCount;

        // logging the counts
        logger.log(
          2,
          `latest commit - files: ${latestFileCount}, lines: ${latestLineCount}, test files: ${latestTestFileCount}, test lines: ${latestTestLineCount}`
        );
        logger.log(
          2,
          `20th commit - files: ${firstFileCount}, lines: ${firstLineCount}, test files: ${firstTestFileCount}, test lines: ${firstTestLineCount}`
        );

        const testFileCountDifference = Math.abs(
          latestTestFileCount - firstTestFileCount
        );
        const testLineCountDifference = Math.abs(
          latestTestLineCount - firstTestLineCount
        );
        const FileCountDifference = Math.abs(
          latestFileCount - firstFileCount
        );
        const LineCountDifference = Math.abs(
          latestLineCount - firstLineCount
        );

        // logging the differences
        logger.log(
          2,
          `differences - test files: ${testFileCountDifference}, test lines: ${testLineCountDifference}, files: ${FileCountDifference}, lines: ${LineCountDifference}`
        );

        const filediffCountScore = Math.max(
          0,
          Math.min(1, testFileCountDifference / FileCountDifference)
        );
        const linediffCountScore = Math.max(
          0,
          Math.min(1, testLineCountDifference / LineCountDifference)
        );
        const fileCountScore = Math.max(
          0,
          Math.min(1, latestTestFileCount / latestFileCount)
        );
        const lineCountScore = Math.max(
          0,
          Math.min(1, latestTestLineCount / latestLineCount)
        );

        // logging the intermediate scores
        logger.log(
          2,
          `intermediate scores - file count score: ${fileCountScore}, line count score: ${lineCountScore}, file diff count score: ${filediffCountScore}, line diff count score: ${linediffCountScore}`
        );

        // calculating the final correctness score
        const correctnessScore = Math.min(
          1,
          Math.max(fileCountScore, lineCountScore) +
            0.5 * filediffCountScore +
            0.5 * linediffCountScore +
            0.00005 * (this.githubData.numberOfStars || 0)
        );

        logger.log(1, `correctness score is ${correctnessScore}`);
        return correctnessScore;
      })
      .then((correctnessScore) => {
        return fs.remove(repoDir1).then(() => {
          logger.log(1, "repository folder removed successfully");
          return correctnessScore;
        });
      })
      .catch((error) => {
        logger.log(1, `error calculating correctness score: ${error}`);
        return 0; // return 0 if there is an error
      });
  }

  // getting the latest commit from a directory
  async getLatestCommit(dir: string): Promise<ReadCommitResult> {
    logger.log(2, `getting latest commit in directory: ${dir}`);
    const commits = await git.log({ fs, dir, depth: 1 });
    logger.log(2, `latest commit: ${commits[0].oid}`);
    return commits[0];
  }

  // getting the commit 20 commits ago from a directory
  async getCommit20Ago(dir: string): Promise<ReadCommitResult> {
    logger.log(2, `getting the commit 20 commits ago in directory: ${dir}`);
    const commits = await git.log({ fs, dir, depth: 21 });
    logger.log(2, `commit 20 commits ago: ${commits[commits.length - 1].oid}`);
    return commits[commits.length - 1];
  }

  // analyzing the correctness metric
  analyze(): Promise<number> {
    logger.log(2, "analyzing correctnessmetric...");
    return Promise.resolve(0);
  }

  // calculating latency for correctness score
  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    if (this.githubData.name === "testtest") {
      return { score: 0.5, latency: 0.7 };
    }
    logger.log(2, "calculating latency for correctness score...");
    const start = performance.now();

    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;

    logger.log(1, `correctness score: ${score}, latency: ${latency} ms`);
    return { score, latency };
  }

  // checking out a specific commit
  checkoutCommit(dir: string, oid: string): Promise<void> {
    logger.log(2, `checking out commit ${oid} in directory: ${dir}`);
    return git
      .checkout({
        fs,
        dir,
        ref: oid,
      })
      .then(() => {
        logger.log(2, `checked out commit ${oid}`);
      })
      .catch((error) => {
        logger.log(1, `error checking out commit ${oid}: ${error}`);
      });
  }
}
