// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

export class BusFactorMetric extends Metrics {
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
