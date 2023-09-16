import { GithubAPIService } from './git_API_Call';

export class CorrectnessCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    fetchCorrectnessScore(owner: string, repo: string): number {
        const num_stars = this.processNumStars(this.githubAPI.fetchNumStars(owner, repo));
        const num_forks = this.processNumForks(this.githubAPI.fetchNumForks(owner, repo));
        const bug_reports = this.processBugReports(this.githubAPI.fetchBugReports(owner, repo));
        const calculateOverallScore = this.calculateOverallScore(num_stars, num_forks, bug_reports);
    }

    processNumStars(num_stars): number {
        return 0;

    }

    processNumForks(num_forks): number {
        return 0;
    }

    processBugReports(bug_reports): number {
        return 0;

    }

    calcuateOverallScore(num_forks, num_forks, bug_reports): number {
        return 0;
    }
}
