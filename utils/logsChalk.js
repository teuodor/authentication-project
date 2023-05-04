const chalk = require('chalk');

module.exports = {
    success: message => console.log(chalk.green.bold(message)),
    error: message => console.log(chalk.red.bold(message)),
    warning: message => console.log(chalk.yellow.bold(message)),
    info: message => console.log(chalk.blue.bold(message)),
};