import { Issue } from "./IssueInterface.js";
import { Logger } from "./logger.js";
export class   GitHubData{

    public name?:string;
    public numberOfIssues?:number;
    public numberOfCommits?:number;
    public numberOfForks?:number;
    public numberOfStars?:number;
    public numberOfCollaborators?:number;
    public readme?:boolean;
    public description?:boolean;
    public contributions?:Array<{contributor:string,commits:number}>;
    public license?:string;
    public Issues?:Issue[];
    

    constructor(name:string="empty",
        numberOfIssues:number=-1,
        numberOfCommits:number=-1,
        numberOfForks:number=-1,
        numberOfStars:number=-1,
        numberOfCollaborators:number=-1,
        readme:boolean=false,
        description:boolean=false,
        contributions:Array<{contributor:string,commits:number}>=[],
        license:string="empty",
        Issues:Issue[]=[]){


        this.name=name;
        this.numberOfIssues=numberOfIssues;
        this.numberOfCommits=numberOfCommits;
        this.numberOfForks=numberOfForks;
        this.numberOfStars=numberOfStars;
        this.numberOfCollaborators=numberOfCollaborators;
        this.readme=readme;
        this.description=description;
        this.contributions=contributions;
        this.license = license;
        this.Issues = Issues;
    }
    public printMyData(){
        const logger=new Logger();
        logger.log(1, `GitHub Data:`);
        logger.log(1, `Name: ${this.name || "N/A"}`);
        logger.log(1, `Number of Issues: ${this.numberOfIssues !== undefined ? this.numberOfIssues : "N/A"}`);
        logger.log(1, `Number of Commits: ${this.numberOfCommits !== undefined ? this.numberOfCommits : "N/A"}`);
        if(this.contributions)
            logger.log(1, `Contributions Array: ${this.contributions.length > 0 ? this.contributions[0].contributor : "N/A"}`);
        logger.log(2, `Readme Present: ${this.readme ? "Yes" : "No"}`);
        logger.log(2, `Description Present: ${this.description ? "Yes" : "No"}`);
        logger.log(2, `Number of Forks: ${this.numberOfForks !== undefined ? this.numberOfForks : "N/A"}`);
        logger.log(2, `Number of Stars: ${this.numberOfStars !== undefined ? this.numberOfStars : "N/A"}`);
        logger.log(2, `GitHub Data:`);
        logger.log(2, `Name: ${this.name || "N/A"}`);
 
        if(this.contributions)
            logger.log(2, `Contributions Array: ${this.contributions.length > 0 ? this.contributions[0].commits : "N/A"}`);
        logger.log(2, `Readme Present: ${this.readme ? "Yes" : "No"}`);
        logger.log(2, `Description Present: ${this.description ? "Yes" : "No"}`);
        logger.log(2, `Number of Issues: ${this.numberOfIssues !== undefined ? this.numberOfIssues : "N/A"}`);

        
        
    }

}