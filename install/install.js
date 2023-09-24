const { exec, ExecException } = require('child_process');

const command = `npm install`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error installing dependencies:`, error);
  } else {
    const lines = stdout.split('\n');
    let dependencyCount = 0;

    lines.forEach((line) => {
      if (line.includes('added')) {
        const match = line.match(/added (\d+) package/);
        if (match) {
          dependencyCount += parseInt(match[1], 10);
        }
      }
    });

    const filteredLines = lines.filter((line) => {
      return !(
        line.includes('up to date, audited') ||
        line.includes('added') ||
        line.includes('packages are looking for funding') ||
        line.includes('found 0 vulnerabilities') ||
        line.trim() === 'run `npm fund` for details'
      );
    });

    console.log(`${dependencyCount} dependencies installed...`);
    console.log(`${filteredLines.join('\n').trim()}`);
  }
  if (stderr) {
    console.error(stderr);
  }
});
