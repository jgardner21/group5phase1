import { compileFunction } from 'vm';
import { GithubAPIService } from './git_API_call';
import logger from '../../logger';

export class BusFactorCalculator {

    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }




    /**
     * Fetches contributors data from the GitHub API.
     * @returns {Promise<any>} A promise that resolves with the contributors data.
     */
    async fetchContributors() {
        try {
            const contributors = this.githubAPI.fetchAPIdata('contributors');
            return contributors; //Placeholders
        }
        catch {
            return []
        }


    }
    //function which would take the contributorList
    //and find frequencies of the contributors
    //and return a number form 0 - 1.
    /**
     * Calculates the number of contributors to a repository.
     * @returns {Promise<number>} The number of contributors.
     */
    async numContributors() {
        const contributors = await this.fetchContributors();
        if(contributors.length = 0) { //If there is an error in the API call
            return -1
        }
        return contributors.length / 30;
    }




    /**
     * Calculates the concentration score of a repository based on the contributions of its top contributors.
     * @returns A number representing the concentration score, ranging from 0.4 to 1.
     */
    async calcConcentrationScore(): Promise<number> {
        try {
            var contributors = await this.fetchContributors();
        }
        catch {
            return -1
        }
        const totalContributions = contributors.reduce((sum: number, contributor: any) => sum + contributor.contributions, 0);
        const topContributors = contributors.slice(0, 1); // consider the top 3 contributors
        const topContributions = topContributors.reduce((sum: number, contributor: any) => sum + contributor.contributions, 0);
        const concentrationRatio = topContributions / totalContributions;
        if (concentrationRatio >= 0.8) {
            return 0;
        } else if (concentrationRatio >= 0.5) {
            return 0.4; // few contributors have majority
        } else if (concentrationRatio >= 0.4) {
            return 0.6; // moderately distributed
        } else if (concentrationRatio >= 0.3) {
            return 0.7; // moderately distributed
        } else if (concentrationRatio >= 0.2) {
            return 0.8; // moderately distributed
        } else if (concentrationRatio >= 0.1) {
            return 0.9; // moderately distributed
        }
        else {
            return 1; // well distributed
        }
    }

    /**
     * Fetches the CODEOWNERS file from the repository and returns a number based on whether the file exists or not.
     * @returns A Promise that resolves to a number. If the CODEOWNERS file exists, the number is 0. Otherwise, the number is 1.
     */
    async fetchCodeOwners(): Promise<number> {
        try {
            var files = await this.githubAPI.fetchAPIdata('contents');
        }
        catch {
            return -1
        }
        // console.log(files);
        const codeOwnersFile = files.find((file: any) => file.filename === 'CODEOWNERS');
        if (codeOwnersFile) {

            return 0;
        } else {
            return 1;
        }
    }

    //Do the score calculation this in superclass instead

    /**
     * Calculates the total bus factor score based on the number of contributors, contributor frequency, and code owners.
     * @param contributors The number of contributors to the codebase.
     * @param contributor_freq The frequency of contributions by the contributors.
     * @param codeOwners The number of code owners for the codebase.
     * @returns The total bus factor score.
     */
    totalBusScore(contributors: number, contributor_freq: number, codeOwners: number): number {
        logger.info("Successfully calculated bus factor score")
        return 0.2 * contributors + 0.6 * contributor_freq + 0.2 * codeOwners; 

    }
}
