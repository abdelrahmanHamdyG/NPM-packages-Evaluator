// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";

export class ResponsivenessMetric extends Metrics {
  constructor(githubData: GitHubData,npmData:NPMData) {
    super(githubData,npmData);
  }

  public calculateScore(): number {
    
    return -1;
  }

  public calculateLatency():number{

    return -1;
  }
}
