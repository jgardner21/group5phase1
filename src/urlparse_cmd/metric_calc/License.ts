import { GithubAPIService } from './git_API_Call';

export class LicenseCalculator {
    private githubAPI: GithubAPIService;

    constructor(githubAPI: GithubAPIService) {
        this.githubAPI = githubAPI;
    }

    fetchLicenseScore(owner: string, repo: string): number {
        const licenseScore = this.processLicenseScore(this.githubAPI.fetchLicense(owner, repo));
        const overallLicenseScore = this.calculateOverallScore(licenseScore);
        return overallLicenseScore;
    }

    processLicenseScore(licenseData): number {
        return 0;
    }

    calculateOverallScore(licenseScore): number {
        return 0;

    }
}
