const puppeteer = require("puppeteer-extra");
const launch = require("./launch");
const fs = require('fs');
const wait = (ms) => new Promise(res => setTimeout(res, ms));

// Function to format date and time
function getCurrentDateTime() {
  // const ISTOptions = {
  //     timeZone: 'Asia/Kolkata', // Setting timezone to India Standard Time (IST)
  //     weekday: 'long', // Get the full name of the day
  //     month: 'long', // Get the full name of the month
  //     day: 'numeric', // Get the day of the month
  //     year: 'numeric', // Get the full year
  //     hour: 'numeric', // Get the hour in 12-hour format
  //     minute: 'numeric', // Get the minute
  //     second: 'numeric', // Get the second
  //     hour12: true, // Use 12-hour format
  //     timeZoneName: 'short' // Get the abbreviated timezone name
  // };
  
  const currentDate = new Date().toLocaleString(); // Fetches local date and time
  return currentDate;

}

//get WsEndpoint
async function getWsEndpoint() {
    let wsEndpoint = await launch();
    return wsEndpoint;
}

(async () => {
    const browser = await puppeteer.connect({
        browserWSEndpoint: await getWsEndpoint(),
        defaultViewport: null,
    });

    let page = await browser.newPage();
    await page.goto("https://1xbet.com/en/allgamesentrance/crash");

    const client = await page.target().createCDPSession()

    await client.send('Network.enable')

    client.on('Network.webSocketFrameReceived', ({ requestId, timestamp, response }) => {
        let payloadString = response.payloadData.toString('utf8');
        
        try {
          if (payloadString.includes('"ic":true')) {
            payloadString = payloadString.replace(/[^\x20-\x7E]/g, '');
            const payload = JSON.parse(payloadString);
      

            // Get current date and time
            const currentDateTime = getCurrentDateTime();


            const { cf, mfs, ts } = payload.arguments[0];
            console.log(currentDateTime+" => ",cf," |"+ mfs, ts);

            
            // Construct CSV data with date and time
            const csvData = `${currentDateTime},${cf},${mfs},${ts}\n`;
            
            fs.appendFile('data.csv', csvData, (err) => {
              if (err) throw err;
            });
          }
        } catch (error) {
          console.error('Error processing WebSocket frame:', error);
        }
      });

    while(true){
        await page.keyboard.press("Tab");
        await wait(1000);
        await page.keyboard.press("ArrowDown");
        await wait(1000);
    }
})();
