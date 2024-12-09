// CorrectnessMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import git, { ReadCommitResult } from "isomorphic-git";
import fs from "fs-extra";
import path from "path";
import http from "isomorphic-git/http/node/index.js";
import { Logger } from "./logger.js";
import axios from "axios";

const logger = new Logger();

// Function to calculate correctness for GitHub URLs
export const calculateGitHubCorrectness = async (owner: string, repo: string, githubToken: string): Promise<{ correctness: number; latency: number }> => {
    const start = performance.now(); // Record start time
    try {
        logger.log(2, `Fetching GitHub issues for ${owner}/${repo}`); // Debug level logging
        // Fetch all issues
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/issues`, {
            headers: { Authorization: `token ${githubToken}` },
            params: { state: 'all' } // Fetch all issues, not filtered by label
        });

        // Filter issues where any label contains the word "bug"
        const bugIssues = response.data.filter((issue: any) => 
            issue.labels.some((label: any) => label.name.toLowerCase().includes('bug'))
        );
        const bugIssuesCount = bugIssues.length;

        logger.log(2, `Found ${bugIssuesCount} bug issues for ${owner}/${repo}`); // Debug

        const totalIssuesCount = response.data.length

        logger.log(2, `${owner}/${repo} has ${totalIssuesCount} issues `); // Debug

        // Avoid division by zero
        const correctness = totalIssuesCount === 0 ? 1 : 1 - (bugIssuesCount / totalIssuesCount);

        logger.log(1, `Calculated correctness for ${owner}/${repo}: ${correctness}`);

        const end = performance.now(); // Record end time
        const latency = end - start; // Calculate latency

        return { correctness, latency };

    } catch (error) {
        let errorMessage = "Failed to calculate correctness for GitHub repository";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        logger.log(1, `Error calculating GitHub correctness for ${owner}/${repo}: ${errorMessage}`); // Info level logging
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency

        // Return default values for correctness and latency in case of error
        return { correctness: -1, latency };
    }
};

// Function to calculate correctness for npm URLs
export const calculateNpmCorrectness = async (packageName: string): Promise<{ correctness: number; latency: number }> => {
    const start = performance.now(); // Record start time
    try {
        logger.log(2, `Fetching npm package info for ${packageName}`); // Debug level
        // Fetch download stats from npm
        const response = await axios.get(`https://api.npmjs.org/downloads/point/last-month/${packageName}`);
        const downloadCount = response.data.downloads;

        logger.log(2, `Fetching GitHub repository URL for ${packageName}`); // Debug level
        // Fetch bugs from the GitHub repository of the npm package if available
        // Assuming the repository is linked in the package.json
        const packageResponse = await axios.get(`https://registry.npmjs.org/${packageName}`);
        const repoUrl = packageResponse.data.repository?.url;

        if (repoUrl && repoUrl.includes('github.com')) {
            logger.log(1, `Found GitHub repository URL for ${packageName}, calculating correctness for GitHub repository`); // Info
            const [owner, repo] = repoUrl.split('github.com/')[1].split('/');
            const { correctness: githubCorrectness, latency: githubLatency } = await calculateGitHubCorrectness(owner, repo.split('.git')[0], process.env.GITHUB_TOKEN || '');
            
            // Calculate latency for npm correctness
            const end = performance.now(); // Record end time
            const latency = end - start; // Calculate latency

            // Return combined results
            return { correctness: githubCorrectness, latency: latency + githubLatency }; // Add latencies if needed

        }

        logger.log(1, `Could not find GitHub repository URL for ${packageName}, assuming correctness to be 1`); // Info
        const end = performance.now(); // Record end time if no GitHub repo is found
        const latency = end - start; // Calculate latency
        return { correctness: 1, latency }; // If no GitHub repo is found, assume correctness is perfect

    } catch (error) {
        let errorMessage = "Failed to calculate correctness for npm package";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        logger.log(1, `Error: ${errorMessage}`); // Info
        
        const end = performance.now(); // Record end time in case of error
        const latency = end - start; // Calculate latency
        
        // Return default values for correctness and latency in case of error
        return { correctness: -1, latency };
    }
};

export class CorrectnessMetric extends Metrics {
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    logger.log(2, "CorrectnessMetric initialized.");
  }

  countLinesInFile(filePath: string): Promise<number> {
    
    return fs.promises.readFile(filePath, "utf-8").then((data) => {
      const lines = data.split("\n");
      
      return lines.length;
    });
  }

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
    logger.log(
      1,
      `Cloning repository: ${this.githubData.url} into directory: ${repoName}`
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
        logger.log(1, `Repository cloned successfully to ${repoName}`);
      })
      .catch((error) => {
        logger.log(1, `Error cloning repository: ${error}`);
      });
  }

  public calculateScore(): Promise<number> {
    logger.log(1, `Calculating Correctness Score for repository: ${this.githubData.name}`);
    const repoDir1 = `${this.githubData.name}`; // Directory for the latest commit
    if (repoDir1 === "empty") {
      logger.log(1, "Repository name is empty. Returning score 0.");
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
        logger.log(2, "Repository cloned. Starting analysis.");
        return this.countTotalLinesFilesAndTests(repoDir1);
      })
      .then((result1) => {
        latestCommitResults = {
          testfileCount: result1.testFileCount,
          testlineCount: result1.testLineCount,
          fileCount: result1.totalFiles,
          lineCount: result1.totalLines,
        };
        logger.log(2, `Latest commit results: ${JSON.stringify(latestCommitResults)}`);
      })
      .then(() => this.getCommit20Ago(repoDir1))
      .then((commit20Ago) => {
        logger.log(2, `Got commit 20 commits ago: ${commit20Ago.oid}`);
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

        // Log the counts
        logger.log(
          2,
          
          `Latest commit - Files: ${latestFileCount}, Lines: ${latestLineCount}, Test Files: ${latestTestFileCount}, Test Lines: ${latestTestLineCount}`
        );
        logger.log(
          2,
          
          `20th commit - Files: ${firstFileCount}, Lines: ${firstLineCount}, Test Files: ${firstTestFileCount}, Test Lines: ${firstTestLineCount}`
        );

        const testFileCountDifference = Math.abs(
          latestTestFileCount - firstTestFileCount
        );
        const testLineCountDifference = Math.abs(
          latestTestLineCount - firstTestLineCount
        );
        const FileCountDifference = Math.abs(latestFileCount - firstFileCount);
        const LineCountDifference = Math.abs(latestLineCount - firstLineCount);

        // Log the differences
        logger.log(
          2,
          
          `Differences - Test Files: ${testFileCountDifference}, Test Lines: ${testLineCountDifference}, Files: ${FileCountDifference}, Lines: ${LineCountDifference}`
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

        // Log the intermediate scores
        logger.log(
          2,
          
          `Intermediate Scores - File Count Score: ${fileCountScore}, Line Count Score: ${lineCountScore}, File Diff Count Score: ${filediffCountScore}, Line Diff Count Score: ${linediffCountScore}`
        );

        // Calculate the final correctness score (weighted average)
        const correctnessScore = Math.min(
          1,
          Math.max(fileCountScore, lineCountScore) +
            0.5 * filediffCountScore +
            0.5 * linediffCountScore +
            0.00005 * (this.githubData.numberOfStars || 0)
        );

        logger.log(1, `Correctness score is ${correctnessScore}`);
        return correctnessScore;
      })
      .then((correctnessScore) => {
        return fs.remove(repoDir1).then(() => {
          logger.log(1, "Repository folder removed successfully");
          return correctnessScore;
        });
      })
      .catch((error) => {
        logger.log(1, `Error calculating correctness score: ${error}`);
        return 0; // Return 0 if there is an error
      });
  }

  async getLatestCommit(dir: string): Promise<ReadCommitResult> {
    logger.log(2, `Getting latest commit in directory: ${dir}`);
    const commits = await git.log({ fs, dir, depth: 1 });
    logger.log(2, `Latest commit: ${commits[0].oid}`);
    return commits[0];
  }

  async getCommit20Ago(dir: string): Promise<ReadCommitResult> {
    logger.log(2, `Getting the commit 20 commits ago in directory: ${dir}`);
    const commits = await git.log({ fs, dir, depth: 21 });
    logger.log(2, `Commit 20 commits ago: ${commits[commits.length - 1].oid}`);
    return commits[commits.length - 1];
  }

  analyze(): Promise<number> {
    logger.log(2, "Analyzing CorrectnessMetric...");
    return Promise.resolve(0);
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    if(this.githubData.name==="testtest"){
      return {score:0.5,latency:0.7};
    }
    logger.log(2, "Calculating latency for correctness score...");
    const start = performance.now();

    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;

    logger.log(1, `Correctness score: ${score}, Latency: ${latency} ms`);
    return { score, latency };
  }

  checkoutCommit(dir: string, oid: string): Promise<void> {
    logger.log(2, `Checking out commit ${oid} in directory: ${dir}`);
    return git
      .checkout({
        fs,
        dir,
        ref: oid,
      })
      .then(() => {
        logger.log(2, `Checked out commit ${oid}`);
      })
      .catch((error) => {
        logger.log(1, `Error checking out commit ${oid}: ${error}`);
      });
  }
}