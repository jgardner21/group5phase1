import { RampUpCalculator } from '../urlparse_cmd/metric_calc/ramp_up';

describe('RampUp', () => {
  let rampUp: RampUpCalculator;

  beforeEach(() => {
    rampUp = new RampUpCalculator('/path/to/clone');
  });

  describe('scanForDocumentation', () => {
    it('should return 0 if no documentation links are found', () => {
      const readmeContents = 'This is a readme file without any links.';
      const docScore = rampUp.scanForDocumentation(readmeContents);
      expect(docScore).toEqual(0);
    });

    it('should return 1 if a documentation link is found', () => {
      const readmeContents = 'This is a readme file with a [documentation link](https://example.com/docs).';
      const docScore = rampUp.scanForDocumentation(readmeContents);
      expect(docScore).toEqual(1);
    });

    it('should return 1 if a link with "docs" in the URL is found', () => {
      const readmeContents = 'This is a readme file with a [docs link](https://example.com/docs).';
      const docScore = rampUp.scanForDocumentation(readmeContents);
      expect(docScore).toEqual(1);
    });

    it('should return 1 if a link with "documentation" in the URL is found', () => {
      const readmeContents = 'This is a readme file with a [documentation link](https://example.com/documentation).';
      const docScore = rampUp.scanForDocumentation(readmeContents);
      expect(docScore).toEqual(1);
    });

    it('should return 1 if a link with "wiki" in the URL is found', () => {
      const readmeContents = 'This is a readme file with a [wiki link](https://example.com/wiki).';
      const docScore = rampUp.scanForDocumentation(readmeContents);
      expect(docScore).toEqual(1);
    });
  });

  describe('calcRampUpScore', () => {
    it('should return 1 if there are no dependencies and external documentation is present', () => {
      const readmeLength = 100;
      const hasExtDocumentation = 1;
      const numDependancies = 0;
      const score = rampUp.calcRampUpScore(readmeLength, hasExtDocumentation, numDependancies);
      expect(score).toEqual(1);
    });

    it('should return 0 if there are no dependencies and no external documentation is present', () => {
      const readmeLength = 100;
      const hasExtDocumentation = 0;
      const numDependancies = 0;
      const score = rampUp.calcRampUpScore(readmeLength, hasExtDocumentation, numDependancies);
      expect(score).toEqual(0);
    });

    it('should return a score between 0 and 1 based on the number of dependencies and readme length', () => {
      const readmeLength = 500;
      const hasExtDocumentation = 0;
      const numDependancies = 10;
      const score = rampUp.calcRampUpScore(readmeLength, hasExtDocumentation, numDependancies);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});