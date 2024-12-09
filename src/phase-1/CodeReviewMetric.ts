import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { GitHubAPI } from "./GitHubAPI.js";  // Import GitHubAPI class
import { Logger } from "./logger.js";

const logger = new Logger();

export class CodeReviewMetric extends Metrics {
  constructor(
    githubData: GitHubData, 
    npmData: NPMData,
   
  ) {
    super(githubData, npmData);
    logger.log(1, "CodeReviewMetric instance created.");
  }

  // Method to calculate the code review fraction score
  public async calculateCodeReviewFraction(): Promise<{ fraction: number; totalCodeIntroduced: number; reviewedCode: number }> {
    logger.log(1, "Calculating code review fraction...");
    
    try {
      // Use the GitHubAPI's calculateCodeReviewFraction method, passing owner and repoName
      if (!this.githubData.owner || !this.githubData.repoName) {
        throw new Error("GitHub data is missing required properties.");
      }
      
      const githubAPI = new GitHubAPI(this.githubData.owner, this.githubData.repoName);
      const result = await githubAPI.calculateCodeReviewFraction();
      console.log(result);

      const fraction = result.fraction;
      const totalCodeIntroduced = result.totalCodeIntroduced;
      const reviewedCode = result.reviewedCode;

      logger.log(1, `Code review fraction calculated: ${fraction}`);
      logger.log(1, `Total code introduced: ${totalCodeIntroduced}`);
      logger.log(1, `Reviewed code: ${reviewedCode}`);

      return { fraction, totalCodeIntroduced, reviewedCode };
    } catch (error) {
      logger.log(2, "Error calculating code review fraction: " + error);
      return { fraction: 0, totalCodeIntroduced: 0, reviewedCode: 0 };
    }
  }

  // Method to calculate the final score for code review fraction
  public async calculateScore(): Promise<number> {
    logger.log(1, "Calculating code review fraction score...");

    const { fraction } = await this.calculateCodeReviewFraction();
    const scaled_fraction = fraction;

    if (scaled_fraction > 1) {
      return 1;
    }
    return scaled_fraction;
  }

  // Method to calculate the latency for calculating code review score
  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    logger.log(1, "Calculating latency for code review fraction score calculation...");
    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;

    logger.log(1, `Calculated score: ${score}, Latency: ${latency} ms`);
    return { score, latency };
  }
}
