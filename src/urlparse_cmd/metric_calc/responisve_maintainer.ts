import { GithubAPIService } from './git_API_call';

export class Responsive_MaintainerCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }


    async calcPullResponseTime(): Promise<number> {
        const pullRequests = await this.githubAPI.fetchAPIdata('pulls');
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
        if (score < 0) {
            return 0;
        } else {
            return score;
        }
    }


    async calcIssueResponseTime(): Promise<number> {
        //Same as above
        const issue_response = await this.githubAPI.fetchAPIdata('issues');
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
        if (score < 0) {
            return 0;
        } else {
            return score;
        }
    }




    //Should add time since last commit to this

    totalResponsivenessScore(avg_pull_response_time: number, avg_issue_response_time: number): number {
        const pull_weight = 0.6; // weight of pull request response time in the score
        const issue_weight = 0.4; // weight of issue response time in the score
    // calculate the score based on the average response times

    // combine the scores and return the total score

        return (avg_pull_response_time * pull_weight + avg_issue_response_time * issue_weight);
    }
}
