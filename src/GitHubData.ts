export class   GitHubData{

    public name?:string;
    public numberOfIssues?:number;
    public numberOfCommits?:number;
    

    constructor(name:string="empty",
        numberOfIssues:number=-1,numberOfCommits:number=-1){
        this.name=name;
        this.numberOfIssues=numberOfIssues;
        this.numberOfCommits=numberOfCommits;
        
    }
}