// super fast browser - like it :)
require('dotenv').config()

// Add limit event listeners
try {
    process.setMaxListeners(0);
} catch (e){
    console.log(`Error setMaxListeners :: ${e}`)
}

const fs        = require('fs')
const shell     = require('shelljs')
const readline  = require('readline');

const Helper = require('./services/helpers')
const IN_FILE           = process.env.IN_FILE
const BATCH_SIZE        = process.env.BATCH_SIZE;

// Run async process
async function main () {
    console.time('main')
    // When starts backup files and start again
    // To-Do: move hardcode text to constants
    const initDate = new Date();
    // Backup
    shell.exec(`cp -R fail.txt backup/fail_${initDate}_.txt`)
    shell.exec(`cp -R hits.txt backup/hits_${initDate}_.txt`)

    // Remove / create
    shell.exec(`rm -rf fail.txt hits.txt`)
    shell.exec(`touch fail.txt hits.txt`)

    // Process lines
    const fileStream = fs.createReadStream(IN_FILE);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lap = 0
    let recordsCounter = 0
    let resolver = []
    for await (const line of rl) {
        recordsCounter += 1
        // Array of promisses
        resolver.push(Helper.processLine(line, lap))
        console.log("resolver :: ", resolver)

        if (recordsCounter >= BATCH_SIZE) {
            rl.pause();
            // Run resolver
            const resolveAll = await Promise.all(resolver)
            console.log("resolveAll: ", resolveAll)

            // Remove pptr dev profiles
            shell.exec('rm -rf /tmp/puppeteer_dev_*')
            console.log("Dev profile removed :: pptr")

            recordsCounter = 0;
            resolver = [];
            rl.resume();
        }
    }
    console.log("Resolve all promisses ::: ")
    console.timeEnd('main')
}
main()