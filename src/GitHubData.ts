import { Issue } from "./IssueInterface.js";
export class   GitHubData{

    public name?:string;
    public numberOfIssues?:number;
    public numberOfCommits?:number;
    contributionsArray?: number[] = [];
    public readme?:boolean;
    public description?:boolean;
    public numberOfForks?:number;
    public numberOfStars?:number;
    public license?:string;
    public Issues?:Issue[];
    

    constructor(name:string="empty",
        numberOfIssues:number=-1,numberOfCommits:number=-1,
        contributionsArray: number[] = [],readme:boolean=false,
        description:boolean=false,
        numberOfForks:number=-1,numberOfStars:number=-1,license:string="empty",
        Issues:Issue[]=[]){
        this.name=name;
        this.numberOfIssues=numberOfIssues;
        this.numberOfCommits=numberOfCommits;
        this.contributionsArray = contributionsArray;
        this.readme = readme;
        this.description = description;
        this.numberOfForks = numberOfForks;
        this.numberOfStars = numberOfStars;
        this.license = license;
        this.Issues = Issues;
    }
}