export class GitHubData{

    public name?:string;
    public numberOfIssues?:number;
    public numberOfCommits?:number;
    

    constructor(name:string,numberOfIssues:number,numberOfCommits:number){
        this.name=name;
        this.numberOfIssues=numberOfIssues;
        this.numberOfCommits=numberOfCommits;
        
    }
}