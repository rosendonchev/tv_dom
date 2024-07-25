const fs = require('fs');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');

async function scrapeAndPushToGit() {
    // Clear the sources.m3u file before writing new data
    fs.writeFileSync('sources.m3u', '', 'utf-8');
    fs.appendFileSync('sources.m3u', "#EXTM3U\n", 'utf-8');
    
    // Launch a new browser instance with --no-sandbox flag
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Replace this URL with the URL of the page containing the links you want to scrape
    const url = 'https://www.seir-sanduk.com/?id=bnt-2&pass=55EKLkasldkfa55';
    
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Extract all links from the page
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
                    .map(link => link.href)
                    .filter(href => href); // Filter out empty hrefs
    });

    for (let link of links) {
        try {
            await page.goto(link, { waitUntil: 'networkidle2' });

            const playerSource = await page.evaluate(() => {
                const scriptTags = document.querySelectorAll('script');
                let source = null;
                
                scriptTags.forEach(script => {
                    const scriptContent = script.innerHTML;
                    if (scriptContent.includes('new Clappr.Player')) {
                        const match = scriptContent.match(/new Clappr\.Player\s*\(\s*{[^}]*source:\s*["']([^"']+)["']/);
                        if (match) {
                            source = match[1];
                        }
                    }
                });

                return source;
            });

            if (playerSource) {
                if (playerSource != "https://www.seir-sanduk.com/otustanausta1.mp4") {
                    const data = `#EXTINF:-1,Player Source\n${playerSource}\n`;

                    // Append the data to sources.m3u
                    fs.appendFileSync('sources.m3u', data, 'utf-8');
                    
                    console.log(`Data successfully written for ${link}`);
                }
            } else {
                console.log(`player.source not found for ${link}`);
            }
        } catch (error) {
            console.error(`Error visiting ${link}: ${error.message}`);
        }
    }

    // Close the browser instance
    await browser.close();

    // Execute Git commands to add, commit, and push the changes
    exec('git add sources.m3u', (err, stdout, stderr) => {
        if (err) {
            console.error(`Error adding file: ${stderr}`);
            return;
        }

        exec('git commit -m "Update sources.m3u with new player sources"', (err, stdout, stderr) => {
            if (err) {
                console.error(`Error committing file: ${stderr}`);
                return;
            }

            exec('git push', (err, stdout, stderr) => {
                if (err) {
                    console.error(`Error pushing to repository: ${stderr}`);
                    return;
                }

                console.log('Changes successfully pushed to GitHub repository');
            });
        });
    });
}

// Export the function to be used in the server
// module.exports = scrapeAndPushToGit;