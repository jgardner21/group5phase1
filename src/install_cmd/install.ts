import { exec, ExecException } from 'child_process';


function install_dependencies() {

  const command = `npm install`;

  exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
    if (error) {
      console.error(`Error installing dependencies:`, error);
    } else {
      console.log(`Dependencies installed successfully.`);
    }
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }

  });
}

install_dependencies()