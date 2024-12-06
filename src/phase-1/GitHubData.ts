import { Issue } from "./IssueInterface.js";
import { Logger } from "./logger.js";
export class   GitHubData{

    public owner?:string;
    public repoName?:string;
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
    


    constructor(
        owner:string="empty",
        repoName:string="empty",
        url:string="empty",
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
        this.owner=owner
        this.repoName=repoName
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
        logger.log(2, `Readme Present: ${this.readme ? "Yes" : "No"}`);
        logger.log(2, `Description Present: ${this.description ? "Yes" : "No"}`);
        logger.log(2, `Number of Forks: ${this.name !== "empty" 
        ? this.numberOfForks : "N/A"}`);
        logger.log(2, `Number of Stars: ${this.name !== "empty" 
        ? this.numberOfStars : "N/A"}`);
        logger.log(2, "GitHub Data:");
        logger.log(2, `Name: ${this.name}`);
        logger.log(2, `License Name: ${this.name !== "empty" ? this.
        license: "N/A"} `);
        if(this.contributions)
            logger.log(2, `Contributions Array: ${this.contributions.length > 0 ?
         this.contributions[0].commits : "N/A"}`);
        logger.log(2, `Readme Present: ${this.readme ? "Yes" : "No"}`);
        logger.log(2, `Description Present: ${this.description ? "Yes" : "No"}`);
        logger.log(2, `Number of Issues: ${this.name !== "empty" ?
         this.numberOfclosedIssues : "N/A"}`);
    }

}