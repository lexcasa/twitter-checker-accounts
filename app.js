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
const path      = require('path')
const Piscina   = require('piscina')
const readline  = require('readline');

const piscina = new Piscina({
    filename: path.resolve(__dirname, 'services/helpers.js')
});

// console.log("Helper: ", Helper)

const {processLine}     = require('./services/helpers')
const {delay}           = require('./services/utils')
const IN_FILE           = process.env.IN_FILE
const DELAY_TIME        = process.env.DELAY_TIME
const BATCH_SIZE        = process.env.BATCH_SIZE;

// Run async process
async function main () {
    console.time('main')
    // When starts backup files and start again
    // To-Do: move hardcode text to constants
    const initDate = (new Date()).toISOString();
    // Backup
    shell.exec(`cp -R fail.txt backup/fail_${initDate}_.txt`)
    shell.exec(`cp -R hits.txt backup/hits_${initDate}_.txt`)

    // Remove / create
    shell.exec('rm -rf fail.txt hits.txt')
    shell.exec('touch fail.txt hits.txt');

    const rawTotalLines = shell.exec('echo $(wc -l < combos.txt)')
    const totalLines    = parseInt( rawTotalLines.stdout.match(/\d+/)[0] ) + 1

    // Process lines
    const fileStream = fs.createReadStream(IN_FILE);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lap = 0
    let recordsCounter = 0
    let totalCounter   = 0
    let progressBar    = 1
    let resolver = []

    for await (const line of rl) {
        recordsCounter += 1
        totalCounter   += 1
        // Array of promisses
        resolver.push(
            piscina.run({line: line, lap: lap}, { name: 'processLine' })
        )
        // console.log("resolver :: ", resolver)

        if (recordsCounter >= BATCH_SIZE) {
            rl.pause();
            // Run resolver
            await Promise.all(resolver)

            // Remove pptr dev profiles
            shell.exec('rm -rf /tmp/puppeteer_dev_*')
            console.log("Dev profile removed :: pptr")

            recordsCounter = 0;
            resolver = [];

            await delay(DELAY_TIME);
            console.log("wait system to rest :: finish")
            rl.resume();
        }
        progressBar = (totalCounter/totalLines) * 100
        console.log(`Total resolved :: ${totalCounter} of ${totalLines} - Completed %${progressBar}`)
    }
    console.log("Resolve all promisses ::: ")
    console.timeEnd('main')
}
main()