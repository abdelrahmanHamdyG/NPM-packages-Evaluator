import { Issue } from "./IssueInterface.js";
import { Logger } from "./logger.js";

// class to hold and manage data related to a github repository
export class GitHubData {

    // properties for storing various github repository data
    public url?: string;
    public name?: string;
    public numberOfclosedIssues?: number;
    public numberOfCommits?: number;
    public numberOfForks?: number;
    public numberOfStars?: number;
    public numberOfCollaborators?: number;
    public readme?: boolean;
    public description?: boolean;
    public contributions?: Array<{ contributor: string, commits: number }>;
    public license?: string;
    public Closed_Issues?: Issue[];
    public size?: number;
    public openIssues?: Issue[];
    public latency: number;

    // constructor to initialize the githubdata object with default values
    constructor(
        url: string = "empty",
        name: string = "empty",
        numberOfClosedIssues: number = 0,
        numberOfCommits: number = 0,
        numberOfForks: number = 0,
        numberOfStars: number = 0,
        numberOfCollaborators: number = 0,
        readme: boolean = false,
        description: boolean = false,
        contributions: Array<{ contributor: string, commits: number }> = [],
        license: string = "empty",
        Closed_Issues: Issue[] = [],
        size: number = 0,
        openIssues: Issue[] = [],
        latency: number = 0
    ) {
        // assign the constructor parameters to the class properties
        this.name = name;
        this.numberOfclosedIssues = numberOfClosedIssues;
        this.numberOfCommits = numberOfCommits;
        this.numberOfForks = numberOfForks;
        this.numberOfStars = numberOfStars;
        this.numberOfCollaborators = numberOfCollaborators;
        this.readme = readme;
        this.description = description;
        this.contributions = contributions;
        this.license = license;
        this.Closed_Issues = Closed_Issues;
        this.url = url;
        this.size = size;
        this.openIssues = openIssues;
        this.latency = latency;
    }

    // method to print the github repository data using a logger
    public printMyData(): void {
        const logger = new Logger(); // create a logger instance
        
        // log whether the repository has a readme and description
        logger.log(2, `readme present: ${this.readme ? "yes" : "no"}`);
        logger.log(2, `description present: ${this.description ? "yes" : "no"}`);
        
        // log the number of forks and stars if the name is not "empty"
        logger.log(2, `number of forks: ${this.name !== "empty" ? this.numberOfForks : "n/a"}`);
        logger.log(2, `number of stars: ${this.name !== "empty" ? this.numberOfStars : "n/a"}`);

        // log general information about the repository
        logger.log(2, "github data:");
        logger.log(2, `name: ${this.name}`);
        logger.log(2, `license name: ${this.name !== "empty" ? this.license : "n/a"}`);

        // if contributions exist, log the number of commits by the first contributor
        if (this.contributions) {
            logger.log(2, `contributions array: ${this.contributions.length > 0 ? this.contributions[0].commits : "n/a"}`);
        }
        
        // log the number of closed issues if the repository name is not "empty"
        logger.log(2, `number of issues: ${this.name !== "empty" ? this.numberOfclosedIssues : "n/a"}`);
    }

}
