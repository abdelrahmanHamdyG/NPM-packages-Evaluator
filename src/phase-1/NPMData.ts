
import { Logger } from "./logger.js";

export class NPMData{

    public license?:string;
    public githubUrl?:string;
    public latency:number;
    public dependencies: Record<string, string>; // Add dependencies field
    

    // constructor(license:string="empty",githubUrl:string="empty",latency:number=0,){
        
    //     this.license=license;
    //     this.githubUrl=githubUrl;
    //     this.latency=latency;

    // }
    constructor(
    license: string = "empty",
    githubUrl: string = "empty",
    latency: number = 0,
    dependencies: Record<string, string> = {} // Initialize dependencies
  ) {
    this.license = license;
    this.githubUrl = githubUrl;
    this.latency = latency;
    this.dependencies = dependencies;
  }
    public printMyData():void {
        
        const logger=new Logger();

        logger.log(2, "NPM Data:");
        logger.log(2, `License: ${this.license}`);
        logger.log(2, `GitHub URL: ${this.githubUrl}`);
        logger.log(2, `Dependencies: ${JSON.stringify(this.dependencies)}`);
        
        
    }

    
}