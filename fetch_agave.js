const fs = require('fs');
const https = require('https');
const path = require('path');

const url = "https://www.agaveboots.com.mx/products.json?limit=250";
const outputPath = path.join(__dirname, 'src', 'assets', 'agave_products.json');

// Ensure assets dir exists
const assetsDir = path.dirname(outputPath);
if (!fs.existsSync(assetsDir)){
    fs.mkdirSync(assetsDir, { recursive: true });
}

const file = fs.createWriteStream(outputPath);

https.get(url, function(response) {
  response.pipe(file);
  file.on('finish', () => {
    file.close(() => {
        console.log("Download Completed: " + outputPath);
    });
  });
}).on('error', (err) => {
    fs.unlink(outputPath, () => {}); // Delete the file async. (But we don't check result)
    console.error("Error: " + err.message);
});
