import { Responsive_MaintainerCalculator } from '../urlparse_cmd/metric_calc/responisve_maintainer';
import { GithubAPIService } from '../urlparse_cmd/metric_calc/git_API_call';

describe('Responsive_MaintainerCalculator', () => {
    let responsiveMaintainerCalculator: Responsive_MaintainerCalculator;
    let githubAPIService: GithubAPIService;

    beforeEach(() => {
        githubAPIService = new GithubAPIService('owner', 'repo');
        responsiveMaintainerCalculator = new Responsive_MaintainerCalculator(githubAPIService);
    });

    it('should fetch pull requests from the GitHub API', async () => {
        const pullRequests = await responsiveMaintainerCalculator.calcPullResponseTime();
        expect(pullRequests).toBeDefined();
    });

    it('should calculate the average response time for pull requests', async () => {
        const avgPullResponseTime = await responsiveMaintainerCalculator.calcPullResponseTime();
        expect(avgPullResponseTime).toBeGreaterThanOrEqual(0);
        expect(avgPullResponseTime).toBeLessThanOrEqual(1);
    });

    it('should fetch issues from the GitHub API', async () => {
        const issues = await responsiveMaintainerCalculator.calcIssueResponseTime();
        expect(issues).toBeDefined();
    });

    it('should calculate the average response time for issues', async () => {
        const avgIssueResponseTime = await responsiveMaintainerCalculator.calcIssueResponseTime();
        expect(avgIssueResponseTime).toBeGreaterThanOrEqual(0);
        expect(avgIssueResponseTime).toBeLessThanOrEqual(1);
    });

    it('should calculate the total responsiveness score', () => {
        const avgPullResponseTime = 0.5;
        const avgIssueResponseTime = 0.7;
        const responsivenessScore = responsiveMaintainerCalculator.totalResponsivenessScore(avgPullResponseTime, avgIssueResponseTime);
        expect(responsivenessScore).toBeGreaterThan(0);
        expect(responsivenessScore).toBeLessThanOrEqual(1);
    });
});