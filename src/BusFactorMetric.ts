// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

export class BusFactorMetric extends Metrics {
  constructor(githubData: GitHubData,npmData:NPMData) {
    super(githubData,npmData);
  }

  public calculateScore(): number {
    
    const totalCommits = this.totalCommits();
  
    const hhi = this.HHI(totalCommits);

    const busFactor = 1 - hhi;
  
    return busFactor;
  }

  public totalCommits():number{
    let totalCommits = 0;
    if(this.githubData.contributions?.length){
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        totalCommits += this.githubData.contributions[i].commits;
      }
      return totalCommits;
    }
    return -1;
  }

  public HHI(totalCommits:number):number{
    let hhi = 0;
    if(this.githubData.contributions?.length){
      for (let i = 0; i < this.githubData.contributions.length; i++) {
        const share = this.githubData.contributions[i].commits / totalCommits;
        hhi += share * share;
      }
      return hhi;
    }
    return -1;
  }

  public calculateLatency():number{

    return -1;
  }
}
