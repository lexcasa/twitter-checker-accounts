const Cron = require('../services/cron');

async function runner () {
    console.log("Start runner ::")
    Cron.cleanTmpFiles('*/5 * * * *')
}
runner()