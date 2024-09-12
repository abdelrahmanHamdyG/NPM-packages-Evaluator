export class NPMData{

    public license?:string;
    public githubUrl?:string;
    

    constructor(license:string="empty",githubUrl:string="empty"){
        
        this.license=license;
        this.githubUrl=githubUrl;

    }
    
}