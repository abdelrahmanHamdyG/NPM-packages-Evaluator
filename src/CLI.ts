
import { fetchRepoData } from "./API_fetch.js";
import { PackageData } from "./PackageData.js";
import { fetchNpmPackageData } from "./API_fetch.js";
import { exec } from "child_process";

export class CLI {


    public testSuites():void {
        console.log("we should test things here");
    }
    
    
    public rankModules(path:string):void {
        
        console.log("we are in the rank modules");
        fetchNpmPackageData("even").then(

            (res:void | JSON) =>{
                 console.log(res);
            
          });

        fetchRepoData("abdelrahmanHamdyG", "ECE-46100-Project-").then(
            (res:void | JSON) =>{
                if (res){
                const res_obj= res as PackageData ;
                
                const res_info: PackageData = {
                    name: res_obj.name,
                };
                console.log(res_info.name);
            }
            });
        console.log("we found the file " + path);
    }

}
