// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

export class BusFactorMetric extends Metrics {
  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
  }

  public async calculateScore():Promise<number>{
    const totalCommits = this.totalCommits();

    if (totalCommits <= 0) return 0; // Handle edge case where there are no commits

    const hhi = this.HHI(totalCommits);

    
    const busFactor = Math.max(0, 1 - hhi);

    return busFactor;
  }

  public totalCommits(): number {
    let totalCommits = 0;
    if (this.githubData.contributions?.length) {
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        totalCommits += this.githubData.contributions[i].commits;
      }
    }
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
    return hhi; // Value is between 0 and 1
  }

  public async calculateLatency(): Promise<{ score: number; latency: number }> {
    const start = performance.now();
    const score=await this.calculateScore();
    const end = performance.now();
    return {score,latency:end - start};
  }
}
