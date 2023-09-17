import { BusFactorCalculator } from "./bus_factor";
import { RampUpCalculator } from "./ramp_up";
import { CorrectnessCalculator } from "./correctness";
import { LicenseCalculator } from "./license";
import { Responsive_MaintainerCalculator as ResponsiveMaintainerCalculator } from "./responisve_maintainer";
import { GithubAPIService } from './git_API_call';

export class MetricScores {
    num_users: number = 0; //Want this as a method of the superclass because it's important for calculating scores relative to the # of users
    bus_factor: BusFactorCalculator;
    ramp_up: RampUpCalculator;
    correctness: CorrectnessCalculator;
    license: LicenseCalculator;
    responiveness: ResponsiveMaintainerCalculator;

    constructor(githubAPI: GithubAPIService, repo_obj: Object) {
        this.bus_factor = new BusFactorCalculator(githubAPI);
        this.ramp_up = new RampUpCalculator(githubAPI);
        this.correctness = new CorrectnessCalculator(githubAPI, repo_obj);
        this.license = new LicenseCalculator(githubAPI);
        this.responiveness = new ResponsiveMaintainerCalculator(githubAPI);

    }

    async getNumUsers(githubAPI: GithubAPIService) {
        this.num_users = (await githubAPI.fetchAPIdata('/traffic/clones')).count;
        console.log(this.num_users)
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
        //Probably not doing anything with this
        return -1
    }

    getCorrectness(): number {
        const num_stars = this.correctness.calcNumStars();
        const num_forks = this.correctness.calcNumForks();
        const bug_reports = this.correctness.calcBugReports();

        return this.correctness.totalCorrectnessScore(num_stars, num_forks, bug_reports); //Not our actual calculation method just using it as a placeholder
    }

    getLicense(): number {
        const pkg_license = this.license.getPkgLicense();

        return this.license.checkCompatability()
    }

    getResponsiveness(): number {
        const pull_response_time = this.responiveness.calcPullResponseTime();

        const issue_response_time = this.responiveness.calcIssueResponseTime();

        return this.responiveness.totalResponsivenessScore(pull_response_time, issue_response_time);
    }
}