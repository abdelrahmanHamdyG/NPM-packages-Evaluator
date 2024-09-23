import { Logger } from "./logger.js";

// Defining the NPMData class to store information about NPM packages
export class NPMData{

    public license?:string;
    public githubUrl?:string;
    public latency:number;
    
    // Initializing the class with license, GitHub URL, and latency values
    constructor(license:string="empty",githubUrl:string="empty",latency:number=0){
        
        this.license=license;
        this.githubUrl=githubUrl;
        this.latency=latency;

    }

    // Printing the stored data using the logger
    public printMyData():void {
        
        const logger=new Logger();

        logger.log(2, "NPM Data:");
        logger.log(2, `License: ${this.license}`);
        logger.log(2, `GitHub URL: ${this.githubUrl}`);
        
        
    }
    
}
