const command = `npm install`;
const { spawn } = require('child_process');

const npmInstall = spawn(command, { shell: true });

let dependencyCount = 0;

npmInstall.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  lines.forEach((line) => {
    if (line.includes('added')) {
      const match = line.match(/added (\d+) package/);
      if (match) {
        dependencyCount += parseInt(match[1], 10);
      }
    }
  });
});

npmInstall.stderr.on('data', (data) => {
  console.error(data.toString());
});

npmInstall.on('close', (code) => {
  if (code === 0) {
    console.log(`${dependencyCount} dependencies installed...`);
  } else {
    console.error(`Error installing dependencies with exit code ${code}`);
  }
});
