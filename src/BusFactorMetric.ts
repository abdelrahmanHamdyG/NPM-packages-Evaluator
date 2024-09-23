// BusFactorMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js";

// initializing logger instance
const logger = new Logger();

// defining class to calculate the bus factor metric
export class BusFactorMetric extends Metrics {
  // constructing the class with github and npm data
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    logger.log(2, "BusFactorMetric initialized.");
  }

  // calculating the bus factor score
  public async calculateScore(): Promise<number> {
    logger.log(2, "Calculating BusFactor score...");
    const totalCommits = this.totalCommits(); // getting total commits

    // returning score 0 when no commits are found
    if (totalCommits <= 0) {
      logger.log(1, "No commits found in the repository.");
      return 0;
    }

    logger.log(2, `Total commits: ${totalCommits}`);

    // calculating the hhi (herfindahl-hirschman index)
    const hhi = this.HHI(totalCommits);
    logger.log(2, `HHI (Herfindahl-Hirschman Index): ${hhi}`);

    // calculating the bus factor
    const busFactor = Math.max(0, 1 - hhi);
    logger.log(1, `Calculated BusFactor: ${busFactor}`);

    return busFactor; // returning the bus factor score
  }

  // calculating the total number of commits
  public totalCommits(): number {
    let totalCommits = 0;
    if (this.githubData.contributions?.length) {
      // looping through contributions and summing up commits
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        totalCommits += this.githubData.contributions[i].commits;
      }
    }
    logger.log(2, `Total commits calculated: ${totalCommits}`);
    return totalCommits;
  }

  // calculating the hhi (herfindahl-hirschman index)
  public HHI(totalCommits: number): number {
    let hhi = 0;
    if (this.githubData.contributions?.length) {
      // looping through contributions to calculate hhi
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        const share = this.githubData.contributions[i].commits / totalCommits;
        hhi += share * share; // summing squared shares
      }
    }
    logger.log(2, `HHI calculated: ${hhi}`);
    return hhi; // returning hhi value
  }

  // measuring latency for calculating the bus factor score
  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    logger.log(2, "Measuring latency for BusFactor score calculation...");
    const start = performance.now();
    const score = await this.calculateScore(); // calculating the score
    const end = performance.now();
    const latency = end - start; // measuring the time taken

    logger.log(1, `BusFactor score: ${score}, Latency: ${latency} ms`);
    return { score, latency }; // returning score and latency
  }
}
