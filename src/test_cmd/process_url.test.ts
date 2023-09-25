import get_metric_scores from '../urlparse_cmd/process_url';
import fs from 'fs';

describe('get_metric_scores', () => {
  test('should throw an error if file name is invalid', async () => {
    await expect(get_metric_scores('invalid_file.txt')).rejects.toThrow('Invalid file name, please provide the absolute file path of an ASCII-encoded, newline-delimited URLs');
  });

  test('should calculate metric scores for valid npm package', async () => {
    const url = 'https://www.npmjs.com/package/express';
    const filename = 'test/valid_urls.txt';
    const expectedOutput = '{"URL":"https://www.npmjs.com/package/express", "NET_SCORE":0.00000, "RAMP_UP_SCORE":0.00000, "CORRECTNESS_SCORE":0.00000, "BUS_FACTOR_SCORE":0.00000, "RESPONSIVE_MAINTAINER_SCORE":0.00000, "LICENSE_SCORE":0.00000}\n';
    const output = await get_metric_scores(filename);
    expect(output).toEqual(expectedOutput);
    fs.appendFileSync('logs/test.log', `Actual output for ${url}: ${output}\n`);
  });

  test('should calculate metric scores for valid GitHub repository', async () => {
    const url = 'https://github.com/microsoft/TypeScript';
    const filename = 'test/valid_urls.txt';
    const expectedOutput = '{"URL":"https://github.com/microsoft/TypeScript", "NET_SCORE":0.00000, "RAMP_UP_SCORE":0.00000, "CORRECTNESS_SCORE":0.00000, "BUS_FACTOR_SCORE":0.00000, "RESPONSIVE_MAINTAINER_SCORE":0.00000, "LICENSE_SCORE":0.00000}\n';
    const output = await get_metric_scores(filename);
    expect(output).toEqual(expectedOutput);
    fs.appendFileSync('logs/test.log', `Actual output for ${url}: ${output}\n`);
  });

  test('should throw an error for invalid URL', async () => {
    const url = 'https://www.google.com';
    const filename = 'test/valid_urls.txt';
    await expect(get_metric_scores(filename)).rejects.toThrow('Invalid link, link must be of the form https://www.npmjs.com/package/{name} or https://www.github.com/{repo}/{owner}');
  });

  test('should calculate metric scores for multiple valid URLs', async () => {
    const filename = 'test/multiple_urls.txt';
    const expectedOutput = '{"URL":"https://www.npmjs.com/package/express", "NET_SCORE":0.00000, "RAMP_UP_SCORE":0.00000, "CORRECTNESS_SCORE":0.00000, "BUS_FACTOR_SCORE":0.00000, "RESPONSIVE_MAINTAINER_SCORE":0.00000, "LICENSE_SCORE":0.00000}\n{"URL":"https://github.com/microsoft/TypeScript", "NET_SCORE":0.00000, "RAMP_UP_SCORE":0.00000, "CORRECTNESS_SCORE":0.00000, "BUS_FACTOR_SCORE":0.00000, "RESPONSIVE_MAINTAINER_SCORE":0.00000, "LICENSE_SCORE":0.00000}\n';
    const output = await get_metric_scores(filename);
    expect(output).toEqual(expectedOutput);
    const urls = ['https://www.npmjs.com/package/express', 'https://github.com/microsoft/TypeScript'];
    urls.forEach((url) => {
      fs.appendFileSync('logs/test.log', `Actual output for ${url}: ${output}\n`);
    });
  });
});
