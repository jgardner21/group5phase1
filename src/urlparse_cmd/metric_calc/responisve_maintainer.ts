import logger from '../../logger';
import { GithubAPIService } from './git_API_call';

export class Responsive_MaintainerCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }


    /**
     * Calculates the average response time of pull requests and returns a score between 0 and 1.
     * A score of 1 means that the maintainer is very responsive, while a score of 0 means that the maintainer is not responsive at all.
     * @returns A promise that resolves to a number between 0 and 1.
     */
    async calcPullResponseTime(): Promise<number> {
        try {
            var pullRequests = await this.githubAPI.fetchAPIdata('pulls');
        }
        catch {
            return -1
        }

        let totalResponseTime = 0;
        let numPullRequests = 0;
        let maxResponseTime = 0;
        let minResponseTime = 100000;
        // console.log(pullRequests);
        pullRequests.forEach((pullRequest: any) => {
            if (pullRequest.updated_at) {
                const createdTime = new Date(pullRequest.created_at);
                const updatedTime = new Date(pullRequest.updated_at);
                const responseTime = Math.floor((updatedTime.getTime() - createdTime.getTime()) / (1000 * 60 * 60 * 24));
                if (responseTime > maxResponseTime) {
                    maxResponseTime = responseTime;
                } else if (responseTime < minResponseTime) {
                    minResponseTime = responseTime;
                }
                // console.log(updatedTime.toLocaleDateString(), createdTime.toLocaleDateString(), responseTime);
                totalResponseTime += responseTime;
                numPullRequests++;
            }
        });

        if (numPullRequests === 0) {
            return 1;
        }

        const avg = totalResponseTime / numPullRequests;
        // console.log("pull", avg, 1 - avg * (1 / 365));
        const score = 1 - avg * (1 / 365);

        logger.debug(`Calculated average pull request response time as ${avg}`)
        if (score < 0) {
            return 0;
        } else {
            return score;
        }
    }


    /**
     * Calculates the average response time of issues and returns a score based on the average.
     * @returns A Promise that resolves to a number representing the score.
     */
    async calcIssueResponseTime(): Promise<number> {
        //Same as above
        try {
            var issue_response = await this.githubAPI.fetchAPIdata('issues');
        }
        catch {
            return -1
        }

        let totalResponseTime = 0;
        let numIssueRequests = 0;
        let maxResponseTime = 0;
        let minResponseTime = 100000;
        // console.log(issue_response_time);
        issue_response.forEach((issues: any) => {
            if (issues.updated_at) {
                const createdTime = new Date(issues.created_at);
                const updatedTime = new Date(issues.updated_at);
                const responseTime = Math.floor((updatedTime.getTime() - createdTime.getTime()) / (1000 * 60 * 60 * 24));
                if (responseTime > maxResponseTime) {
                    maxResponseTime = responseTime;
                } else if (responseTime < minResponseTime) {
                    minResponseTime = responseTime;
                }
                // console.log(updatedTime.toLocaleDateString(), createdTime.toLocaleDateString(), responseTime);
                totalResponseTime += responseTime;
                numIssueRequests++;
            }
        });

        if (numIssueRequests === 0) {
            return 1;
        }

        let avg = totalResponseTime / numIssueRequests;
        const score = 1 - avg * (1 / 365);
        // console.log("issue", avg, 1 - avg * (1 / 365));
        logger.debug(`Calculated average issue response time as ${avg}`)

        if (score < 0) {
            return 0;
        } else {
            return score;
        }
    }




    //Should add time since last commit to this

    /**
     * Calculates the total responsiveness score based on the average pull request response time and average issue response time.
     * @param avg_pull_response_time The average response time for pull requests.
     * @param avg_issue_response_time The average response time for issues.
     * @returns The total responsiveness score.
     */
    totalResponsivenessScore(avg_pull_response_time: number, avg_issue_response_time: number): number {
        const pull_weight = 0.6; // weight of pull request response time in the score
        const issue_weight = 0.4; // weight of issue response time in the score
    // calculate the score based on the average response times

    // combine the scores and return the total score
        logger.info("Successfully calculated responsiveness score")
        return (avg_pull_response_time * pull_weight + avg_issue_response_time * issue_weight);
    }
}
