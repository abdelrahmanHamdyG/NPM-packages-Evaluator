
import { Logger } from "./logger.js";

export class NPMData{

    public license?:string;
    public githubUrl?:string;
    

    constructor(license:string="empty",githubUrl:string="empty"){
        
        this.license=license;
        this.githubUrl=githubUrl;

    }
    public printMyData() {
        
        const logger=new Logger();
        logger.log(1, `NPM Data:`);
        logger.log(1, `License: ${this.license || "N/A"}`);
        logger.log(1, `GitHub URL: ${this.githubUrl || "N/A"}`);
        logger.log(2, `NPM Data:`);
        logger.log(2, `License: ${this.license || "N/A"}`);
        logger.log(2, `GitHub URL: ${this.githubUrl || "N/A"}`);
        
        
    }

    
}