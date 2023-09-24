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
     * Calculates the frequency of contributions made by each contributor
     * @returns An array of numbers representing the frequency of contributions made by each contributor
     */
    async calcContributorList() {
        try {
            var contributors = await this.fetchContributors();
        } 
        catch {
            return []
        }
        let contributorFreq: any = [];
        for (let i = 0; i < contributors.length; i++) {
            const contributionCount = contributors[i].contributions;
            contributorFreq.push(contributionCount);
        }
        const sum: any = contributorFreq.reduce((sum: number, num: number) => sum + num, 0);
        for (let j = 0; j < contributorFreq.length; j++) {
            contributorFreq[j] = (contributorFreq[j] / sum) * 100;
        }
        return contributorFreq;
    }

    // async calcGiniCoefficient(): Promise<number> {

    //     const contributorFreq = await this.calcContributorList();
    //     console.log(contributorFreq);
    //     const n = contributorFreq.length;
    //     let numerator = 0;
    //     let denominator = 0;
    //     for (let i = 0; i < n; i++) {
    //         for (let j = 0; j < n; j++) {
    //             numerator += Math.abs(contributorFreq[i] - contributorFreq[j]);
    //             denominator += contributorFreq[i];
    //         }
    //     }
    //     console.log(numerator / (2 * denominator * n));
    //     return numerator / (2 * denominator * n);
    // }
    /**
     * Calculates the concentration score of a repository based on the contributions of its top contributors.
     * @returns A number representing the concentration score, ranging from 0.4 to 1.
     */
    async calcConcentrationScore(): Promise<number> {
        const contributors = await this.fetchContributors();
        const totalContributions = contributors.reduce((sum: number, contributor: any) => sum + contributor.contributions, 0);
        const topContributors = contributors.slice(0, 1); // consider the top 3 contributors
        const topContributions = topContributors.reduce((sum: number, contributor: any) => sum + contributor.contributions, 0);
        const concentrationRatio = topContributions / totalContributions;
        if (concentrationRatio >= 0.5) {
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
        const files = await this.githubAPI.fetchAPIdata('contents');
        // console.log(files);
        const codeOwnersFile = files.find((file: any) => file.filename === 'CODEOWNERS');
        if (codeOwnersFile) {
            // const codeOwnersContent = await this.githubAPI.fetchAPIdata(`contents/${codeOwnersFile.path}`);
            // const codeOwners = codeOwnersContent.split('\n').filter((line: string) => line.startsWith('*')).map((line: string) => line.substring(1).trim());
            return 0;
        } else {
            return 1;
        }
    }
    //Need a function to calc frequency of 1 person's involvement with pull requests

    // async getPullNumbers(): Promise<number[]> {
    //     const pullRequests = await this.githubAPI.fetchAPIdata("pulls");
    //     const pullNumbers = pullRequests.map((pullRequest: any) => pullRequest.number);
    //     return pullNumbers;
    // }

    // async getPullRequestApprovers(pullNumber: number): Promise<string[]> {
    //     const reviews = await this.githubAPI.fetchAPIdata(`pulls/${pullNumber}/reviews`);
    //     const approvers = reviews.filter((review: any) => review.state === 'APPROVED').map((review: any) => review.user.login);
    //     return approvers;
    // }

    // async getPullRequestApproversForRepo(): Promise<Map<number, string[]>> {
    //     const pullNumbers = await this.getPullNumbers();
    //     const approversMap = new Map<number, string[]>();
    //     for (const pullNumber of pullNumbers) {
    //         const approvers = await this.getPullRequestApprovers(pullNumber);
    //         approversMap.set(pullNumber, approvers);
    //     }
    //     return approversMap;
    // }


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
        return 0.2 * contributors + 0.8 * contributor_freq + 0.2 * codeOwners; 

    }
}
