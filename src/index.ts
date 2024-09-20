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
        
    default:{
        const start = performance.now();
        
        logger.log(1,"we are going to rank the modules now");
        logger.log(2,`rank modules is called with parameter =${mode} `);
        cli.rankModules(mode);
        const end = performance.now();
        logger.log(2,`total delay of fetching is ${end-start}`);
    }
        break;
        
};



