const http = require('http');
const scrapeAndPushToGit = require('./scrape');

// Create a basic HTTP server
const server = http.createServer(async (req, res) => {
    if (req.url === '/scrape') {
        try {
            await scrapeAndPushToGit();
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Scraping and Git push completed successfully\n');
        } catch (error) {
            console.error('Error scraping and pushing to Git:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error\n');
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
    }
});

// Start the server on a dynamically assigned port
server.listen(0, async () => {
    const address = server.address();
    console.log(`Server is running on http://localhost:${address.port}`);

    try {
        // Perform initial scraping and Git push after server starts
        await scrapeAndPushToGit();
        console.log('Initial scraping and Git push completed successfully');
        setInterval(await scrapeAndPushToGit, 1800000)
    } catch (error) {
        console.error('Error performing initial scraping and pushing to Git:', error);
    }

});
