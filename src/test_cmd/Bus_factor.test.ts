import { BusFactorCalculator } from '../urlparse_cmd/metric_calc/bus_factor';
import { GithubAPIService } from '../urlparse_cmd/metric_calc/git_API_call';

describe('BusFactorCalculator', () => {
    let busFactorCalculator: BusFactorCalculator;
    let githubAPIService: GithubAPIService;

    beforeEach(() => {
        githubAPIService = new GithubAPIService('cloudinary', 'cloudinary_js');
        busFactorCalculator = new BusFactorCalculator(githubAPIService);
    });

    it('should fetch contributors from the GitHub API', async () => {
        const contributors = await busFactorCalculator.fetchContributors();
        expect(contributors).toBeDefined();
    });

    it('should calculate the number of contributors', async () => {
        const numContributors = await busFactorCalculator.numContributors();
        expect(numContributors).toBeGreaterThan(-1);
    });

    it('should calculate the concentration score', async () => {
        const concentrationScore = await busFactorCalculator.calcConcentrationScore();
        expect(concentrationScore).toBeGreaterThanOrEqual(0.4);
        expect(concentrationScore).toBeLessThanOrEqual(1);
    });

    it('should fetch the CODEOWNERS file from the repository', async () => {
        const codeOwners = await busFactorCalculator.fetchCodeOwners();
        expect(codeOwners).toBeGreaterThanOrEqual(0);
        expect(codeOwners).toBeLessThanOrEqual(1);
    });

    it('should calculate the total bus factor score', () => {
        const contributors = 1;
        const contributorFreq = 0.8;
        const codeOwners = 1;
        const busFactorScore = busFactorCalculator.totalBusScore(contributors, contributorFreq, codeOwners);
        expect(busFactorScore).toBeGreaterThan(0);
        expect(codeOwners).toBeLessThanOrEqual(1);

    });
});
