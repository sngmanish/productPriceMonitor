const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const url = process.argv[2];
const belowthis = process.argv[3];


async function configureBrowser() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}

async function checkPrice(page) {
    await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
    // console.log(html);

    $('#priceblock_ourprice', html).each(function() {
        let Price = $(this).text();
        
        let currentPrice = Number(Price.replace(/[^0-9.-]+/g,""));

        if (currentPrice < belowthis) {
            console.log("BUY!!!! " + currentPrice);
            sendNotification(currentPrice);
        }
    });
}

async function startTracking() {
    const page = await configureBrowser();
  
    let job = new CronJob('* */30 * * * *', function() { //runs every 30 minutes in this config
      checkPrice(page);
    }, null, true, null, null, true);
    job.start();
}

async function sendNotification(price) {

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: '*****e@gmail.com',
        pass: '*****'
      }
    });
  
    let textToSend = 'Price dropped to ' + price;
    let htmlText = `<a href=\"${url}\">Link</a>`;
  
    let info = await transporter.sendMail({
      from: '"Price Tracker" <******@gmail.com>',
      to: "*****@gmail.com",
      subject: 'Price dropped to ' + price, 
      text: textToSend,
      html: htmlText
    });
  
    console.log("Message sent: %s", info.messageId);
  }

startTracking();