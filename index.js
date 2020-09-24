require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

const PRODUCT_ID = 'B00DCYMVB2';
const PRODUCT_URL = `https://www.amazon.com/dp/${PRODUCT_ID}`;
const FIFTEEN_MIN_MS = 1000 * 60 * 15;

let interval;

function fetchPage() {
    return axios.get(PRODUCT_URL, { timeout: 10000 });
}

function scrapePage(data) {
    const $ = cheerio.load(data);
    const title = $('#productTitle').text().trim();
    const availability = $('#availability > span').text().trim();
    if (!title) {
        throw new Error('Could not find title in page');
    }
    if (!availability) {
        throw new Error('Could not find availability in page');
    }
    return { title, availability };
}

function sendEmail(availability) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_ADDRESS,
            pass: process.env.GMAIL_TOKEN,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: process.env.EMAIL_ADDRESS,
        subject: `Item is ${availability}`,
        text: `${PRODUCT_URL} - ${availability}`,
    };

    console.log('Sending email notification...');

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
            console.log('Done');
            clearInterval(interval);
        }
    });
}

async function main() {
    const date = new Date();
    const { status, statusText, data } = await fetchPage();
    if (status !== 200) {
        throw new Error(`Fetch failed. ${status}: ${statusText}`);
    }

    const { title, availability } = scrapePage(data);

    console.log('\n');
    console.log(date.toLocaleString());
    console.log(title);
    console.log(availability);
    if (availability !== 'Temporarily out of stock.') {
        sendEmail(availability);
    }
}

main();
interval = setInterval(main, FIFTEEN_MIN_MS);
