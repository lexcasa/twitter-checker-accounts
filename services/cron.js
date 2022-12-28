const NodeCron = require('node-cron')
const shell = require('shelljs');

const Cron = {
    cleanTmpFiles: async function (cronTab){
        NodeCron.schedule(cronTab, () => {
            console.log('running :: cleanTmpFiles func');
            shell.exec('rm -rf /tmp/puppeteer_dev_*')
            console.log('done :: cleanTmpFiles func');
        });
    }
}
module.exports = Cron