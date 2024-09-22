import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Logger } from "./logger.js"; // Assuming Logger is available

export class BusFactorMetric extends Metrics {
  private logger: Logger;

  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
    this.logger = new Logger(); // Initialize logger
  }

  public async calculateScore(): Promise<number> {
    this.logger.log(1, "Calculating Bus Factor...");

    const totalCommits = this.totalCommits();
    if (totalCommits <= 0) {
      this.logger.log(1, "No commits found in the repository. Returning Bus Factor: 0");
      return 0;
    }

    this.logger.log(2, `Total Commits: ${totalCommits}`);

    const hhi = this.HHI(totalCommits);
    this.logger.log(2, `HHI (Herfindahl-Hirschman Index) calculated: ${hhi}`);

    const busFactor = Math.max(0, 1 - hhi);
    this.logger.log(1, `Bus Factor calculated: ${busFactor}`);

    return busFactor;
  }

  public totalCommits(): number {
    let totalCommits = 0;

    if (this.githubData.contributions?.length) {
      this.logger.log(2, `Found ${this.githubData.contributions.length} contributors.`);
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        totalCommits += this.githubData.contributions[i].commits;
        this.logger.log(2, `Contributor 
          ${this.githubData.contributions[i].contributor} has 
          ${this.githubData.contributions[i].commits} commits.`);
      }
    } else {
      this.logger.log(1, "No contributors found in the GitHub data.");
    }

    this.logger.log(1, `Total commits from all contributors: ${totalCommits}`);
    return totalCommits;
  }

  public HHI(totalCommits: number): number {
    let hhi = 0;

    if (this.githubData.contributions?.length) {
      this.logger.log(2, "Calculating HHI (Herfindahl-Hirschman Index)...");
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        const share = this.githubData.contributions[i].commits / totalCommits;
        hhi += share * share; // Sum of squared shares
        this.logger.log(2, `Contributor 
          ${this.githubData.contributions[i].contributor} has a share of 
          ${share} (${share * share} squared).`);
      }
    }

    this.logger.log(1, `Final HHI value: ${hhi}`);
    return hhi; // Value is between 0 and 1
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    this.logger.log(1, "Calculating Bus Factor with latency measurement...");

    const start = performance.now();
    const score = await this.calculateScore();
    const end = performance.now();
    const latency = end - start;

    this.logger.log(1, `Bus Factor score: ${score}`);
    this.logger.log(2, `Latency: ${latency} milliseconds`);

    return { score, latency };
  }
}
