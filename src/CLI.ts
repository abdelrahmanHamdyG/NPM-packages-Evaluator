/* eslint-disable no-useless-escape */
import { GitHubAPI } from "./GitHubAPI.js";
import { NpmAPI } from "./NpmAPI.js";
import {GitHubData } from "./GitHubData.js";
import {NPMData } from "./NPMData.js";
import {Logger} from "./logger.js";
import fs from "fs/promises";
import { CorrectnessMetric } from "./CorrectnessMetric.js";
import { ResponsivenessMetric } from "./ResponsivenessMetric.js";
import { RampUpMetric } from "./RampUpMetric.js";
import { BusFactorMetric } from "./BusFactorMetric.js";
import { LicenseMetric } from "./LicenseMetric.js";







const logger=new Logger();

export class CLI {
    public testSuites(): void {
        
        logger.log(1,"we started testing now");
    }
    

    private async readFromFile(path:string):Promise<Array<string>>{
        
        try{
        
        const data=await fs.readFile(path,"utf8");

        const z:Array<string>=data.split("\n");

        z.forEach((v,i,arr)=>{

            arr[i]=v.trim();
        }) ;
        return z;

        }catch(err){
            logger.log(2,"there is an error in path "+path+"  " +err);
            return [];  
        }
        
    }

    public rankModules(path: string): void {
        this.rankModulesTogether(path)
            .then(results => {

                logger.log(1,"\n\nThe data fetched for each url:\n\n")
                logger.log(2,"\n\nThe data fetched for each url:\n\n")
                results.forEach(({ npmData, githubData }, index) => {

                        
                        
                        logger.log(1, `Result ${index + 1}:`);
                        logger.log(2, `Result ${index + 1}:`);
                        if(npmData)
                            npmData.printMyData();
                        logger.log(1,"\n**************************\n")
                        logger.log(2,"\n**************************\n")
                    
                        if(githubData)
                            githubData.printMyData();
                        logger.log(1,"\n\n\n**************************\n\n\n")
                        logger.log(2,"\n\n\n**************************\n\n\n")
                        if(githubData&&npmData){
                            const correctnessMetric=new CorrectnessMetric(githubData,npmData);
                            const responsiveNessMetric=new ResponsivenessMetric(githubData,npmData);
                            const rampUpMetric=new RampUpMetric(githubData,npmData);
                            const busFactorMetric=new BusFactorMetric(githubData,npmData);
                            const licenseMetric=new LicenseMetric(githubData,npmData);
                            const responsivenessScore=responsiveNessMetric.calculateScore();
                            const rampUp=rampUpMetric.calculateScore();
                            const busFactor=busFactorMetric.calculateScore();
                            const license=licenseMetric.calculateScore();
                            
                        }
                });
            })
            .catch(error => {
                logger.log(2, `Error in rankModules: ${error}`);
            });
    }
    

    public async rankModulesTogether(path: string): 
    Promise<{npmData:void|NPMData,githubData:void |GitHubData}[]> {


        logger.log(2,"rankModulesFunction is called and the path is " + path);
        
        try{

        const urls=await this.readFromFile(path);
        const promisesArray=[];
        for(let i=0;i<urls.length;i++){
            
            
            let gitUrl="empty";
            let npmUrl="empty";
            if(urls[i][8]=="g"){
                gitUrl=urls[i];
            }else{
                npmUrl=urls[i];
            }
            
            logger.log(2,`the url ${urls[i]} has github url =${gitUrl} and npm url= ${npmUrl}`)
            const data= this.fetchBothData(npmUrl,gitUrl);
            promisesArray.push(data);
        }

        const z= await Promise.all(promisesArray);
        return z;


        }catch(err){
            logger.log(2,"error happens while ranking modules: "+err);
            return [];
        }

    }



    public async fetchBothData(npmUrl:string,githubUrl:string):
    Promise<{npmData:void|NPMData,githubData:void |GitHubData}>{
        
        
        let npmData=new NPMData();
        let githubData=new GitHubData();
        if(githubUrl!="empty"){

            
            const githubObject=this.parseGitHubUrl(githubUrl);
            logger.log(2,"the github user is "+githubObject.
                username+ " the github repo is "+githubObject.repoName);
            const gitHubAPI=new GitHubAPI(githubObject.username
                ,githubObject.repoName);

            logger.log(2,`we are fetching data for the giturl:${githubUrl}\n with username:${githubObject.username} and reponame:${githubObject.repoName}`)

            githubData= await gitHubAPI.fetchData();
           
           return { npmData,githubData};
        }else{
            
            const npmObject=this.parseNpmPackageUrl(npmUrl);
            logger.log(2,"the npm package is  "+npmObject);
                
            const npmAPI=new NpmAPI(npmObject);
            npmData=await npmAPI.fetchData();
            logger.log(2,`we are fetching data for the npmurl:${npmUrl}\n with packagenam:${npmData}\n`)
            if(npmData.githubUrl&&npmData.githubUrl!="empty"){
                const githubObject=this.parseGitHubUrl(npmData.githubUrl);
                logger.log(2,`we got the github url after the npm url and it is :${npmData.githubUrl}`)

                const gitHubAPI=new GitHubAPI(githubObject.username
                    ,githubObject.repoName);
                githubData= await gitHubAPI.fetchData();
                
            }
            return {npmData,githubData};

        }



            
        
    }

    private parseGitHubUrl(url: string):
     { username: string, repoName: string }  {
        
        const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
    
        // Apply the regex to the provided URL
        const match = url.match(regex);
    
        if (match) {
            // Extract username and repository name from the match
            const [, username, repoName] = match;
            return { username, repoName };
        } else {
            // Return null if the URL does not match the expected pattern
            return {username:"empty",repoName:"empty"};
        }
    
    }

    private parseNpmPackageUrl(url: string): string  {
        const regex = /https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;

        // Apply the regex to the provided URL
        const match = url.match(regex);
    
        // If a match is found, return the package name, otherwise return null
        return match ? match[1] : "empty";
    
        
    }
    
    
    
}