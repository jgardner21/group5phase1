import { BusFactorCalculator } from "./bus_factor";
import { RampUpCalculator } from "./ramp_up";
import { CorrectnessCalculator } from "./correctness";
import { LicenseCalculator } from "./license";
import { Responsive_MaintainerCalculator as ResponsiveMaintainerCalculator } from "./responisve_maintainer";
import { CodeReviewFractionCalculator } from "./code_review_frac";
import { DependencyPinningCalculator } from "./pinned_dependencies_frac";
import { GithubAPIService } from './git_API_call';
import { getPackageJSONFromClone } from "./local_clone";
import logger from "../../logger";

export class MetricScores {
    bus_factor: BusFactorCalculator;
    ramp_up: RampUpCalculator;
    correctness: CorrectnessCalculator;
    license: LicenseCalculator;
    responsiveness: ResponsiveMaintainerCalculator;
    pinned_frac: DependencyPinningCalculator;
    reviewed_pull_frac: CodeReviewFractionCalculator;
    local_clone: string; //Filepath of local clone of repo
    packageJSON: any; //JSON object directly extracted from the package.json
    //We need it in multiple spots, so it makes sense to get it here

    constructor(githubAPI: GithubAPIService, repo_obj: any, local_clone: string) {
        //Use any as type for objects because it becomes a massive pain if we don't

        //Create instances of our 7 classes for calcing scores
        this.bus_factor = new BusFactorCalculator(githubAPI);
        this.ramp_up = new RampUpCalculator(local_clone);
        this.correctness = new CorrectnessCalculator(githubAPI, repo_obj);
        this.license = new LicenseCalculator(repo_obj);
        this.responsiveness = new ResponsiveMaintainerCalculator(githubAPI);
        this.pinned_frac = new DependencyPinningCalculator(githubAPI);
        this.reviewed_pull_frac = new CodeReviewFractionCalculator(githubAPI);
        
        this.local_clone = local_clone
        this.packageJSON = getPackageJSONFromClone(this.local_clone) //This is needed from the clone in a multiple spots so we do this here to avoid extracting it twice
    }

    
    async getBusFactor() {

        //Call each subfunction for calculating parts of bus factor
        // const num_contributors = (await this.bus_factor.calcContributorNum());

        const contributionCount = await this.bus_factor.numContributors();
        if(contributionCount == -1) {
            logger.error("Failed to get number of contributors")
            return 0
        }
        else {
            logger.debug(`Found ${contributionCount} contributors`)
        }
        const contributor_list = await this.bus_factor.calcConcentrationScore();
        if(contributor_list == -1) {
            logger.error("Unable to calculate concentration score")
            return 0
        }
        else {
            logger.debug(`Determined contributor concentration score of ${contributor_list}`)
        }
        const codeowners = await this.bus_factor.fetchCodeOwners();
        if(codeowners == -1) {
            logger.error("Failed to check for codeowners")
            return 0
        }

        return this.bus_factor.totalBusScore(contributionCount, contributor_list, codeowners);
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
        
        //Drawbacks of this approach: 
        //  Num dependancies isn't actually a great analog for the complexity of using the package, but we don't have anything better to work with
        //  We assume all external documentation is good at explaining the functionality, which is definitely not always the case

        //In an ideal world, we would want to do something along the lines of "how much documentation is there relative to the amount of exported functions"

        const cloningScores: any = this.ramp_up.scanReadme();
        if(cloningScores.readmeLength == -1) { //If it errored
            console.error("Failed to calculate ramp up score")
            return 0
        }

        const readmeLength: number = cloningScores.readmeLength;
        const hasDocumentation: number = cloningScores.docScore;

        //const numFunctions = this.ramp_up.numFunctionsExported(this.packageJSON);
        const numDependancies: number = this.ramp_up.numOfDependancies(this.packageJSON);

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

        //We check compatability by an array of compatible licenses

        const pkg_license = this.license.getPkgLicense(this.packageJSON);
        if(pkg_license == '') { //If you couldn't find a license
            console.error("Failed to calculate license score")
            return 0
        }

        return this.license.checkCompatability(pkg_license)
    }

    async getResponsiveness(): Promise<number> {
        const pull_response_time = await this.responsiveness.calcPullResponseTime();
        if(pull_response_time == -1) {
            logger.error("Failed to get pull response time")
            return 0
        }
        else {
            logger.debug(`Pull response time: ${pull_response_time}`)
        }
        const issue_response_time = await this.responsiveness.calcIssueResponseTime();
        if(issue_response_time == -1) {
            logger.error("Failed to get pull response time")
            return 0
        }
        else {
            logger.debug(`Issue response time: ${issue_response_time}`)
        }
    // console.log(issue_response_time);

        return this.responsiveness.totalResponsivenessScore(pull_response_time, issue_response_time);
    }

    
    async getPinnedDependenciesFraction(): Promise<number> {
        try {
            return await this.pinned_frac.calcPinnedDependenciesFraction();
        } catch (error) {
            logger.error(`Error calculating pinned dependencies fraction: ${error}`);
            return 0;
        }
    }

    async getCodeReviewFraction(): Promise<number> {
        try {
            return await this.reviewed_pull_frac.calcCodeReviewFraction();
        } catch (error) {
            logger.error(`Error calculating code review fraction: ${error}`);
            return 0;
        }
    }
}
