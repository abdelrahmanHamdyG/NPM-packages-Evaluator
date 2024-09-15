import {CLI} from "./CLI.js";
import {Logger} from "./logger.js";



const logger=new Logger();
const args=process.argv.slice(2);
const mode=args[0];
const cli=new CLI();
logger.log(1,"\n\n\n********************************************\n\n\n");

switch(mode){
    case "test":
        logger.log(1,"we are running the tests now");
        cli.testSuites();
        break;
    case "rank" :
        logger.log(1,"we are going to rank the modules now");
        logger.log(2,`rank modules is called with parameter =${args[1]} `)
        cli.rankModules(args[1]);

        break;
    default:
        break;
        
};




