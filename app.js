// super fast browser - like it :)
require('dotenv').config()
// Add limit event listeners
require('events').EventEmitter.prototype._maxListeners = 1000;
const fs        = require('fs')
const readline  = require('readline');

const Helper = require('./services/helpers')
const IN_FILE           = process.env.IN_FILE
const BATCH_SIZE        = process.env.BATCH_SIZE;

// Run async process
async function main () {
    console.time('main')
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
            fileStream.pause();
            // Run resolver
            const resolveAll = await Promise.all(resolver)
            console.log("resolveAll: ", resolveAll)

            recordsCounter = 0;
            resolver = [];
            fileStream.resume();
        }
    }
    console.log("Resolve all promisses ::: ")
    console.timeEnd('main')
}
main()