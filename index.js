const { spawn, exec } = require("child_process");
const express = require("express");
const app = express();
const logger = require("./utils/log.js");
const path = require('path');
const chalk = require('chalk');
const pkg = require('./package.json');
const check = require('get-latest-version');
const fs = require('fs')
const semver = require('semver');
const readline = require('readline');

let configJson;
let packageJson;
const sign = '(›^-^)›';
const fbstate = 'appstate.json';

try {
  configJson = require('./config.json');
} catch (error) {
  console.error('Error loading config.json:', error);
  process.exit(1); // Exit the script with an error code
}

const delayedLog = async (message) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const char of message) {
    process.stdout.write(char);
    await delay(50);
  }

  console.log();
};

const showMessage = async () => {
  const message = chalk.yellow(' ') + `The "removeSt" property is set true in the config.json. Therefore, the Appstate was cleared effortlessly! You can now place a new one in the same directory.`;

  await delayedLog(message);
};

if (configJson.removeSt) {
  fs.writeFileSync(fbstate, sign, { encoding: 'utf8', flag: 'w' });
  showMessage();
  configJson.removeSt = false;
  fs.writeFileSync('./config.json', JSON.stringify(configJson, null, 2), 'utf8');
  setTimeout(() => {
    process.exit(0);
  }, 10000);
  return;
}

const PORT = 3000; // Set your desired port here

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/includes/login/cover/index.html'));
});

app.get('/', (req, res) => res.sendStatus(200));

console.clear();
console.log(chalk.bold.dim(` ${process.env.REPL_SLUG}`.toUpperCase() + `(v${pkg.version})`));
logger(`Getting Started!`, "STARTER");
startServer();

async function startServer() {
  app.listen(PORT, () => {
    logger.loader(`Bot is running on port: ${PORT}`);
  });

  app.on('error', (error) => {
    logger(`An error occurred while starting the server: ${error}`, "SYSTEM");
    process.exit(1);
  });

  startBot(0);
}

async function startBot(index) {
  try {
    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        CHILD_INDEX: index,
      },
    });

    child.on("close", (codeExit) => {
      if (codeExit !== 0) {
        startBot(index);
      }
    });

    child.on("error", (error) => {
      logger(`An error occurred while starting the child process: ${error}`, "SYSTEM");
    });
  } catch (err) {
    logger(`Error while starting the bot: ${err}`, "SYSTEM");
  }
}

// The rest of your code remains unchanged...

const excluded = configJson.UPDATE.EXCLUDED || [];

try {
  packageJson = require('./package.json');
} catch (error) {
  console.error('Error loading package.json:', error);
  return;
}

function nv(version) {
  return version.replace(/^\^/, '');
}

async function updatePackage(dependency, currentVersion, latestVersion) {
  if (!excluded.includes(dependency)) {
    const ncv = nv(currentVersion);

    if (semver.neq(ncv, latestVersion)) {
      console.log(chalk.bgYellow.bold(` UPDATE `), `There is a newer version ${chalk.yellow(`(^${latestVersion})`)} available for ${chalk.yellow(dependency)}. Updating to the latest version...`);

      packageJson.dependencies[dependency] = `^${latestVersion}`;

      fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));

      console.log(chalk.green.bold(`UPDATED`), `${chalk.yellow(dependency)} updated to ${chalk.yellow(`^${latestVersion}`)}`);

      exec(`npm install ${dependency}@latest`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error executing npm install command:', error);
          return;
        }
        console.log('npm install output:', stdout);
      });
    }
  }
}

async function checkAndUpdate() {
  if (configJson.UPDATE && configJson.UPDATE.Package) {
    try {
      for (const [dependency, currentVersion] of Object.entries(packageJson.dependencies)) {
        const latestVersion = await check(dependency);
        await updatePackage(dependency, currentVersion, latestVersion);
      }
    } catch (error) {
      console.error('Error checking and updating dependencies:', error);
    }
  } else {
    console.log(chalk.yellow(''), 'Update for packages is not enabled in config.json');
  }
}

// Do not remove anything if you don't know what you're doing! -Yan

setTimeout(() => {
  checkAndUpdate();
}, 20000);

const jsonFilePath = 'includes/database/data/threadsData.json';
const userFile = 'includes/database/data/usersData.json';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function clean() {
  try {
    const sign = '{}';
    fs.writeFileSync(jsonFilePath, sign, { encoding: 'utf8', flag: 'w' });
    fs.writeFileSync(userFile, sign, { encoding: 'utf8', flag: 'w' });
    console.log(chalk.yellow(''), `Thread and User data cleared successfully.`);
  } catch (error) {
    console.error(`Error clearing contents: ${error.message}`);
  }
}

function cleanState() {
  try {
    fs.writeFileSync(fbstate, sign, { encoding: 'utf8', flag: 'w' });
    console.log(chalk.yellow(''),`Appstate cleared successfully! Try adding a new one as a replacement for the previous appstate.`);
  } catch (error) {
    console.error(`Error clearing contents: ${error.message}`);
  }
}

function command() {
  rl.question('', (answer) => {
    if (answer.trim().toLowerCase() === '-clr' || answer.trim().toLowerCase() === '-clean') {
      clean();
    } else if (answer.trim().toLowerCase() === '-cap' || answer.trim().toLowerCase() === '-fbstate') {
      cleanState();
    } else {
      console.log(chalk.yellow(''), chalk.whiteBright(`Invalid command!`));
      command();
    }
    rl.close();
  });
}

setTimeout(() => {
  command();
}, 20000);

// __@YanMaglinte was Here__ //
// -----------------------------//
