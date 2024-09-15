// RampUpMetric.ts
import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";

export class LicenseMetric extends Metrics {
    compatibleLicenses = [
    "GNU General Public License v2 (GPL-2.0)",
    "GNU General Public License v3 (GPL-3.0)",
    "MIT License",
    "BSD License (2-Clause)",
    "BSD License (3-Clause)",
    "Apache License 1.1",
    "Zlib License",
    "X11 License",
    "Public Domain"
];

  constructor(githubData: GitHubData,npmData:NPMData) {
    super(githubData,npmData);
  }
  public calculateScore(): number {
    if (this.compatibleLicenses.includes(this.githubData.license??"")){
      return 1;
    }
    return 0;
  }

  public calculateLatency():number{

    return -1;
  }
}

