import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import git from "isomorphic-git";
import fs from "fs-extra";
import path from "path";
import http from "isomorphic-git/http/node/index.js";
import { Logger } from "./logger.js";

const logger = new Logger();

export class DependencyPinningMetric extends Metrics {
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    logger.log(2, "DependencyPinningMetric initialized.");
  }

    // Clone the repository
    async cloneRepo(): Promise<string> {
        const repoName = this.githubData.name;

        // Ensure repoName is a valid string
        if (!repoName) {
            throw new Error("Repository name is undefined or empty.");
        }

        logger.log(
            1,
            `Cloning repository: ${this.githubData.url} into directory: ${repoName}`
        );

        try {
            await git.clone({
            fs,
            http,
            dir: repoName, // Now guaranteed to be a string
            url: this.githubData?.url as string,
            singleBranch: true,
            depth: 1,
            });
            logger.log(1, `Repository cloned successfully to ${repoName}`);
            return repoName;
        } catch (error) {
            logger.log(1, `Error cloning repository: ${error}`);
            throw error; // Ensure any caller knows about the failure
        }
    }

  // Analyze dependencies in package.json
  async analyzeDependencies(repoDir: string): Promise<number> {
    const packageJsonPath = path.join(repoDir, "package.json");
    try {
      if (!(await fs.pathExists(packageJsonPath))) {
        logger.log(1, "package.json not found. Returning 1.0 as there are no dependencies.");
        return 1.0; // No dependencies
      }

      const packageJson = await fs.readJson(packageJsonPath);
      const dependencies = packageJson.dependencies || {};
      const totalDependencies = Object.keys(dependencies).length;

      if (totalDependencies === 0) {
        logger.log(1, "No dependencies found. Returning 1.0.");
        return 1.0; // No dependencies
      }

      let pinnedCount = 0;

     for (const [dep, version] of Object.entries(dependencies)) {
        // Assert that version is a string
        if (typeof version === "string") {
            // Check if the version is pinned
            if (/^\d+\.\d+\.\d+$|^\d+\.\d+\.x$|^~\d+\.\d+\.\d+$/.test(version)) {
            pinnedCount++;
            }
        } else {
            console.warn(`Dependency ${dep} has an unexpected version type: ${typeof version}`);
        }
    }
 
      const fractionPinned = pinnedCount / totalDependencies;
      logger.log(
        1,
        `Total Dependencies: ${totalDependencies}, Pinned Dependencies: ${pinnedCount}, Fraction Pinned: ${fractionPinned}`
      );
      return fractionPinned;
    } catch (error) {
      logger.log(1, `Error analyzing dependencies: ${error}`);
      throw error;
    }
  }

  // Calculate the score for dependency pinning
  public async calculateScore(): Promise<number> {
    logger.log(1, `Calculating Dependency Pinning Score for repository: ${this.githubData.name}`);
    try {
      const repoDir = await this.cloneRepo();
      const score = await this.analyzeDependencies(repoDir);
      await fs.remove(repoDir); // Cleanup cloned repo
      logger.log(1, `Dependency Pinning Score: ${score}`);
      return score;
    } catch (error) {
      logger.log(1, `Error calculating dependency pinning score: ${error}`);
      return 0; // Return 0 on error
    }
  }

  // Measure latency for the metric calculation
  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    logger.log(2, "Calculating latency for dependency pinning score...");
    const start = performance.now();

    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;

    logger.log(1, `Dependency Pinning Score: ${score}, Latency: ${latency} ms`);
    return { score, latency };
  }

  // Analyze metric (placeholder for future enhancements)
  analyze(): Promise<number> {
    logger.log(2, "Analyzing DependencyPinningMetric...");
    return Promise.resolve(0);
  }
}