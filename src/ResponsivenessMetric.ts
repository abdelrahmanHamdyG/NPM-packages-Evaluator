import { Metrics } from "./Metrics.js";
import { GitHubData } from "./GitHubData.js";
import { NPMData } from "./NPMData.js";
import { Issue } from "./IssueInterface.js";


export class ResponsivenessMetric extends Metrics {

  public filteredIssues: Issue[] = [];

  constructor(githubData: GitHubData, npmData: NPMData) {
    super(githubData, npmData);
  }

  public calculateScore(): number {
    this.filteredIssues = this.githubData.Closed_Issues || [];
    
    if (this.filteredIssues.length === 0) {
      // Assign a neutral score if no issues are present
      return 0.25;
    }

    

    let satndard_no_of_issues = 0;
    const repoSize = this.githubData?.size ?? 0; // Default to 0 if size is undefined

    if (repoSize / 1000 >= 100) {// If the repo size is greater than 100MB
      satndard_no_of_issues = 120;
    } else if (repoSize / 1000 > 50){  
      satndard_no_of_issues = 90;
    }else{
      satndard_no_of_issues = 80;
    }


    if (this.filteredIssues.length > satndard_no_of_issues) {
      return 1;
    }
    const score = Math.max(this.filteredIssues.length / satndard_no_of_issues, 0);
    return score;
  }

  public calculateLatency(): number {
      const start = performance.now();
      this.calculateScore();
      const end = performance.now();
      return end - start;
  }

  
}
