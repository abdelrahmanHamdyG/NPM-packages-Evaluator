
import { Logger } from "./logger.js";

export class NPMData{

    public license?:string;
    public githubUrl?:string;
    public latency:number;
    

    constructor(license:string="empty",githubUrl:string="empty",latency:number=0){
        
        this.license=license;
        this.githubUrl=githubUrl;
        this.latency=latency;

    }
    public printMyData():void {
        
        const logger=new Logger();
        logger.log(1, "NPM Data:");
        logger.log(1, `License: ${this.license}`);
        logger.log(1, `GitHub URL: ${this.githubUrl}`);
        logger.log(2, "NPM Data:");
        logger.log(2, `License: ${this.license}`);
        logger.log(2, `GitHub URL: ${this.githubUrl}`);
        
        
    }

    
}