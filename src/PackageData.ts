export class PackageData{

    name?:string;
    numberOfCommits?:number;
    numberOfForks?:number;
    

    constructor(numberOfCommits:number,numberOfForks:number){
        this.numberOfCommits=numberOfCommits;
        this.numberOfForks=numberOfForks;
    }
}