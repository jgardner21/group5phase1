import { DependencyPinningCalculator } from '../urlparse_cmd/metric_calc/pinned_dependencies_frac';
import { GithubAPIService } from '../urlparse_cmd/metric_calc/git_API_call';

// Mock GithubAPIService to avoid actual API calls during tests
jest.mock('./git_API_call');

describe('DependencyPinningCalculator', () => {
  let githubAPI: GithubAPIService;
  let calculator: DependencyPinningCalculator;

  beforeEach(() => {
    // Create a mock instance of GithubAPIService
    githubAPI = new GithubAPIService('dummy', 'dummy');
    // Create an instance of DependencyPinningCalculator with the mock GithubAPIService
    calculator = new DependencyPinningCalculator(githubAPI);
  });

  afterEach(() => {
    // Clear all mock calls after each test
    jest.clearAllMocks();
  });

  describe('calcPinnedDependenciesFraction', () => {
    it('calculates the fraction of pinned dependencies', async () => {
      // Mock the fetchDependencies method to return a sample list of dependencies
      (githubAPI.fetchAPIdata as jest.Mock).mockResolvedValue([
        { version: '1.0.0' },
        { version: '2.1.3' },
        { version: '' }, // unpinned dependency
      ]);

      const result = await calculator.calcPinnedDependenciesFraction();

      // The expected fraction is 2/3 since 2 out of 3 dependencies have a version
      expect(result).toBeCloseTo(2 / 3);
    });

    it('handles errors and returns -1', async () => {
      // Mock the fetchDependencies method to throw an error
      (githubAPI.fetchAPIdata as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await calculator.calcPinnedDependenciesFraction();

      // The expected result is -1 since there was an error fetching dependencies
      expect(result).toBe(-1);
    });
  });

  // Add more test cases for other methods if needed
});
