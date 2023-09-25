import { createLogger, transports } from 'winston';
import { CorrectnessCalculator } from '../urlparse_cmd/metric_calc/correctness';
import { GithubAPIService } from '../urlparse_cmd/metric_calc/git_API_call';

const logger = createLogger({
  transports: [
    new transports.File({ filename: 'logs/test.log' }),
  ],
});

describe('CorrectnessCalculator', () => {
  let githubAPI: GithubAPIService;
  let repo_obj: any;
  let calculator: CorrectnessCalculator;

  beforeEach(() => {
    githubAPI = new GithubAPIService('dummy', 'dummy');
  });

  describe('totalCorrectnessScore', () => {
    it('should return 0 if the repo has less than 5 stars', () => {
      repo_obj = {
        stargazers_count: 4,
        forks: 20,
      };
      repo_obj.stargazers_count = 4;
      calculator = new CorrectnessCalculator(githubAPI, repo_obj);

      const result1 = calculator.totalCorrectnessScore();
      logger.info(`Actual value 1: ${result1}`);
      expect(result1).toBe(0);
    });

    it('should return 1 if the repo has more than 800 stars or 250 forks', () => {
      repo_obj = {
        stargazers_count: 900,
        forks: 20,
      };
      calculator = new CorrectnessCalculator(githubAPI, repo_obj);

      const result2 = new CorrectnessCalculator(githubAPI, repo_obj).totalCorrectnessScore();
      logger.info(`Actual value 2: ${result2}`);
      expect(result2).toBe(1); // Fails because result2 might not be exactly 1
      
      repo_obj = {
        stargazers_count: 500,
        forks: 300,
      };
      calculator = new CorrectnessCalculator(githubAPI, repo_obj);

      const result3 = new CorrectnessCalculator(githubAPI, repo_obj).totalCorrectnessScore();
      logger.info(`Actual value 3: ${result3}`);
      expect(result3).toBe(1); // Fails because result3 might not be exactly 1
      
    });

    it('should return a value between 0 and 1 for other repos', () => {
      repo_obj = {
        stargazers_count: 50,
        forks: 20,
      };
      calculator = new CorrectnessCalculator(githubAPI, repo_obj);

      const result4 = calculator.totalCorrectnessScore();
      logger.info(`Actual value 4: ${result4}`);
      expect(result4).toBeCloseTo(0.424, 2); // Fails if result4 is not very close to 0.23

    });
  });
});
