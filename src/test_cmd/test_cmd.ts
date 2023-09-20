const { spawnSync } = require('child_process');


export default function begin_tests() {
    const jestResult = spawnSync('npx', ['jest'], { stdio: 'inherit' });

    if (jestResult.error) {
      console.error('Error running tests:', jestResult.error);
      process.exit(1);
    }

    if (jestResult.status !== 0) {
      console.error('Tests failed');
      process.exit(1);
    }

    console.log('Tests passed successfully');
}