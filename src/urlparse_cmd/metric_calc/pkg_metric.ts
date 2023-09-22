import { BusFactorCalculator } from "./bus_factor";
import { RampUpCalculator } from "./ramp_up";
import { CorrectnessCalculator } from "./correctness";
import { LicenseCalculator } from "./license";
import { Responsive_MaintainerCalculator as ResponsiveMaintainerCalculator } from "./responisve_maintainer";
import { GithubAPIService } from './git_API_call';
import { getPackageJSONFromClone } from "./local_clone";

export class MetricScores {
    num_users: number = 0; //Want this as a method of the superclass because it's important for calculating scores relative to the # of users
    bus_factor: BusFactorCalculator;
    ramp_up: RampUpCalculator;
    correctness: CorrectnessCalculator;
    license: LicenseCalculator;
    responiveness: ResponsiveMaintainerCalculator;
    local_clone: string; //Filepath of local clone of repo
    packageJSON: any; //JSON object directly extracted from the package.json
    //We need it in multiple spots, so it makes sense to get it here

    constructor(githubAPI: GithubAPIService, repo_obj: any, local_clone: string) {
        this.bus_factor = new BusFactorCalculator(githubAPI);
        this.ramp_up = new RampUpCalculator(githubAPI, local_clone);
        this.correctness = new CorrectnessCalculator(githubAPI, repo_obj);
        this.license = new LicenseCalculator(githubAPI, repo_obj, local_clone);
        this.responiveness = new ResponsiveMaintainerCalculator(githubAPI);
        this.local_clone = local_clone
        this.packageJSON = getPackageJSONFromClone(this.local_clone)
    }

    getBusFactor(): number {

        //Call each subfunction for calculating parts of bus factor
        const num_contributors = this.bus_factor.calcContributorNum();

        const contributor_list = this.bus_factor.calcContributorList();


        const pull_contrib_frequency = this.bus_factor.calcPullContributions();
        //Do whatever math with it

        //
        return this.bus_factor.totalBusScore(num_contributors, contributor_list, pull_contrib_frequency); //Not our actual calculation method just using it as a placeholder
    }

    getRampUp(): number {
        //General idea:
        //Use # of dependancies to determine complexity of the code internally
        //Use # of exported functions to get an idea of how complex the code is to interact with
        //Evaluate both of these relative to the length of the readme while also considering the precense of external documentation

        //Unfortunately wasn't able to figure out a way to get the # of exported functions
        //Instead just going to use num dependancies
        //On paper, we could get it by installing the package temporarily via npm
        //But that would probably make the code extremely slow, so we're deciding against that

        //We would like to use code size, but taking the size of the entire repo would likely be misleading
        
        //For the sake of our calculations, we're considering our metrics as follows:
        //numDependancies: How complex is the functionality of this package?
        //readmeLength: How well explained is it? Evaluate it roughly relative to the numDependancies
        //hasDocumentation: If this is true and we think there's a link to external documentation somewhere on it, we're assuming the readme is "perfect"
        
        //Drawbacks of this approach: Num dependancies isn't actually a great analog for the complexity of using the package, but we don't have anything better to work with
        //In an ideal world, we would want to do something along the lines of "how much documentation is there relative to the amount of exported functions"

        const cloningScores: any = this.ramp_up.scanReadme();
        const readmeLength = cloningScores.readmeLength;
        const hasDocumentation = cloningScores.docScore;

        //const numFunctions = this.ramp_up.numFunctionsExported(this.packageJSON);
        const numDependancies = this.ramp_up.numOfDependancies(this.packageJSON);

        return this.ramp_up.calcRampUpScore(readmeLength, hasDocumentation, numDependancies)
    }

    getCorrectness(): number {
        //Correctness is only really based on number of stars and number of forks
        //We initially wanted to also include the number of bug reports and potentially the number of users
        //But we didnt have time to do the bug reports and couldn't find an accurate way to get the number of users

        //Stars and forks are both included in that bigger github repo object we pass in the constructor
        //We can just set those up in the class constructor and don't need any extra functions in here

        return this.correctness.totalCorrectnessScore()
    }

    getLicense(): number {
        //This one is pretty simple
        //Just get the license from the package.json
        //If it's not there (which is weirdly the case sometimes), check the repo_obj
        //Repo_obj sometimes has the license but it's pretty inconsistant
        //If its not there either just give up

        //We check compatability by uhhhhhhhhhhhhhhhhhhhhhhhhhh

        const pkg_license = this.license.getPkgLicense(this.packageJSON);
        if(pkg_license == '') { //If you couldn't find a license
            return 0
        }

        return this.license.checkCompatability(pkg_license)
    }

    getResponsiveness(): number {
        const pull_response_time = this.responiveness.calcPullResponseTime();

        const issue_response_time = this.responiveness.calcIssueResponseTime();

        return this.responiveness.totalResponsivenessScore(pull_response_time, issue_response_time);
    }
}