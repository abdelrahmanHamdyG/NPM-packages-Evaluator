import { Issue } from "./IssueInterface.js";
import { Logger } from "./logger.js";
export class   GitHubData{

    
    public url?:string;
    public name?:string;
    public numberOfclosedIssues?:number;
    public numberOfCommits?:number;
    public numberOfForks?:number;
    public numberOfStars?:number;
    public numberOfCollaborators?:number;
    public readme?:boolean;
    public description?:boolean;
    public contributions?:Array<{contributor:string,commits:number}>;
    public license?:string;
    public Closed_Issues?:Issue[];
    public size?:number;
    public openIssues?:Issue[];
    public latency :number;
    


    constructor(url:string="empty",
        name:string="empty",
        numberOfClosedIssues:number=0,
        numberOfCommits:number=0,
        numberOfForks:number=0,
        numberOfStars:number=0,
        numberOfCollaborators:number=0,
        readme:boolean=false,
        description:boolean=false,
        contributions:Array<{contributor:string,commits:number}>=[],
        license:string="empty",
        Closed_Issues:Issue[]=[],
        size:number=0,
        openIssues:Issue[]=[],
        latency:number=0
    ){


        this.name=name;
        this.numberOfclosedIssues=numberOfClosedIssues;
        this.numberOfCommits=numberOfCommits;
        this.numberOfForks=numberOfForks;
        this.numberOfStars=numberOfStars;
        this.numberOfCollaborators=numberOfCollaborators;
        this.readme=readme;
        this.description=description;
        this.contributions=contributions;
        this.license = license;
        this.Closed_Issues = Closed_Issues;
        this.url=url;
        this.size=size;
        this.openIssues=openIssues;
        this.latency=latency;
    }
    public printMyData():void{
        const logger=new Logger();
        logger.log(1, "GitHub Data:");
        logger.log(1, `Name: ${this.name || "N/A"}`);
        logger.log(1, `Number of Closed Issues: ${this.numberOfclosedIssues ?? "N/A"}`);
        logger.log(1, `Number of Commits: ${this.numberOfCommits ?? "N/A"}`);
        
        if (this.contributions && this.contributions.length > 0) {
            logger.log(1, `First Contributor: ${this.contributions[0].contributor}`);
        } else {
            logger.log(1, "No contributions data available.");
        }

        // Log level 2 (Debug)
        logger.log(2, `Readme Present: ${this.readme ? "Yes" : "No"}`);
        logger.log(2, `Description Present: ${this.description ? "Yes" : "No"}`);
        logger.log(2, `Number of Forks: ${this.numberOfForks ?? "N/A"}`);
        logger.log(2, `Number of Stars: ${this.numberOfStars ?? "N/A"}`);
        logger.log(2, `License: ${this.license || "N/A"}`);
        if (this.contributions && this.contributions.length > 0) {
            logger.log(2, `First Contributor Commits: ${this.contributions[0].commits}`);
    }

}}