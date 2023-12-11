import { CodeReviewFractionCalculator } from '../urlparse_cmd/metric_calc/code_review_frac';
import { GithubAPIService } from '../urlparse_cmd/metric_calc/git_API_call';

// Mock GithubAPIService to avoid actual API calls during tests
jest.mock('./git_API_call');

describe('CodeReviewFractionCalculator', () => {
  let githubAPI: GithubAPIService;
  let calculator: CodeReviewFractionCalculator;

  beforeEach(() => {
    // Create a mock instance of GithubAPIService
    githubAPI = new GithubAPIService('dummy', 'dummy');
    // Create an instance of CodeReviewFractionCalculator with the mock GithubAPIService
    calculator = new CodeReviewFractionCalculator(githubAPI);
  });

  afterEach(() => {
    // Clear all mock calls after each test
    jest.clearAllMocks();
  });

  describe('calcCodeReviewFraction', () => {
    it('calculates the fraction of code reviewed in pull requests', async () => {
      // Mock the fetchPullRequests method to return a sample list of pull requests
      (githubAPI.fetchAPIdata as jest.Mock).mockResolvedValue([
        { review_comments: 3, additions: 10, deletions: 5 },
        { review_comments: 0, additions: 8, deletions: 2 }, // not reviewed
        { review_comments: 2, additions: 15, deletions: 7 },
      ]);

      const result = await calculator.calcCodeReviewFraction();

      // The expected fraction is (10 + 5 + 15 + 7) / (10 + 5 + 8 + 2 + 15 + 7)
      expect(result).toBeCloseTo((10 + 5 + 15 + 7) / (10 + 5 + 8 + 2 + 15 + 7));
    });

    it('handles errors and returns -1', async () => {
      // Mock the fetchPullRequests method to throw an error
      (githubAPI.fetchAPIdata as jest.Mock).mockRejectedValue(new Error('API error'));

      const result = await calculator.calcCodeReviewFraction();

      // The expected result is -1 since there was an error fetching pull requests
      expect(result).toBe(-1);
    });
  });

  // Add more test cases for other methods if needed
});
