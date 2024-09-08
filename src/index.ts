import {CLI} from "./CLI.js";


const args=process.argv.slice(2);
const mode=args[0];
console.log(mode);
console.log(args[1]);
const cli=new CLI();
        
switch(mode){
    case "test":
        cli.testSuites();
        break;
    case "rank" :
        cli.rankModules(args[1]);
        break;
    default:
        console.log("no thing");
        break;
        
};




