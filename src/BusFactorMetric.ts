// BusFactorMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js";

const logger = new Logger();

export class BusFactorMetric extends Metrics {
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    logger.log(2, "BusFactorMetric initialized.");
  }

  public async calculateScore(): Promise<number> {
    logger.log(2, "Calculating BusFactor score...");
    const totalCommits = this.totalCommits();

    if (totalCommits <= 0) {
      logger.log(1, "No commits found in the repository.");
      return 0; // Handle case where there are no commits
    }

    logger.log(2, `Total commits: ${totalCommits}`);

    const hhi = this.HHI(totalCommits);
    logger.log(2, `HHI (Herfindahl-Hirschman Index): ${hhi}`);

    const busFactor = Math.max(0, 1 - hhi);
    logger.log(1, `Calculated BusFactor: ${busFactor}`);

    return busFactor;
  }

  public totalCommits(): number {
    let totalCommits = 0;
    if (this.githubData.contributions?.length) {
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        totalCommits += this.githubData.contributions[i].commits;
      }
    }
    logger.log(2, `Total commits calculated: ${totalCommits}`);
    return totalCommits;
  }

  public HHI(totalCommits: number): number {
    let hhi = 0;
    if (this.githubData.contributions?.length) {
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        const share = this.githubData.contributions[i].commits / totalCommits;
        hhi += share * share; // Sum of squared shares
      }
    }
    logger.log(2, `HHI calculated: ${hhi}`);
    return hhi; // Value is between 0 and 1
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    logger.log(2, "Measuring latency for BusFactor score calculation...");
    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;

    logger.log(1, `BusFactor score: ${score}, Latency: ${latency} ms`);
    return { score, latency };
  }
}