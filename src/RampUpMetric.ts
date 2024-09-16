// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

export class RampUpMetric extends Metrics {
  constructor(githubData: GitHubData,npmData:NPMData) {
    super(githubData,npmData);
  }
  public calculateScore(): number {
    const RampUp = this.calculateReadmeDescription() 
    + this.calculateForksStarsPercentage();
    return RampUp;
  }

  public calculateLatency():number{

      const start = performance.now();
      this.calculateScore();  
      const end = performance.now();
      return end - start;  
    }

  public calculateForksStarsPercentage():number{
    const totalForksStars = (this.githubData.numberOfForks ?? 0)
    + (this.githubData.numberOfStars ?? 0);

    if (totalForksStars >= 1000){
      return 0.7;
    }
    else{
      return 0.7 * (totalForksStars/1000);
    }
  }

  public calculateReadmeDescription():number{
    if(this.githubData.readme && this.githubData.description){
      return 0.3;
    }
    else if (this.githubData.readme || this.githubData.description){
      return 0.15;
    }
    return 0;
  }
}
