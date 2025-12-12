const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const archiver = require('archiver');

// Configuración
const AGAVE_BASE = 'https://www.agaveboots.com.mx/collections/all';
const OUT_DIR = path.join(__dirname, '../agave_export');
const IMG_DIR = path.join(OUT_DIR, 'images');

// Crear directorios
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);
if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR);

// Utilidad Sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Descargar Imagen
async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve(false);
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(() => resolve(true));
                });
            } else {
                file.close();
                fs.unlink(filepath, () => { });
                resolve(false);
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            resolve(false);
        });
    });
}

// Escapar CSV
function escapeCsv(text) {
    if (!text) return '';
    let res = text.toString().replace(/"/g, '""'); // Escapar comillas dobles
    res = res.replace(/\n/g, ' '); // Remover saltos de línea
    return `"${res}"`;
}

(async () => {
    console.log('--- INICIANDO EXPORTACIÓN A CSV Y ZIP ---');

    const browser = await puppeteer.launch({
        headless: false, // Visible para debug visual
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    const products = [];

    // 1. Scraping (Páginas 1 a 4)
    for (let p = 1; p <= 4; p++) {
        console.log(`\nProcesando página ${p}...`);
        try {
            await page.goto(`${AGAVE_BASE}?page=${p}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Obtener enlaces de productos
            const links = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a[href*="/products/"]'));
                return [...new Set(anchors.map(a => a.href))];
            });

            console.log(`   - Encontrados ${links.length} productos.`);

            for (const link of links) {
                try {
                    // Ir al detalle
                    await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    const data = await page.evaluate(() => {
                        const title = document.querySelector('h1')?.innerText.trim() || 'Sin Titulo';
                        let description = document.querySelector('.product-description')?.innerText.trim() ||
                            document.querySelector('.rte')?.innerText.trim() ||
                            '';

                        const imgMeta = document.querySelector('meta[property="og:image"]');
                        let imgUrl = imgMeta ? imgMeta.content : '';
                        if (imgUrl && imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;

                        return { title, description, imgUrl };
                    });

                    // Generar SKU
                    const sku = 'AGV-' + Math.random().toString(36).substring(2, 8).toUpperCase();

                    // Nombre archivo imagen
                    let imgFilename = '';
                    if (data.imgUrl) {
                        const ext = path.extname(data.imgUrl.split('?')[0]) || '.jpg';
                        imgFilename = `${sku}${ext}`;
                    }

                    products.push({
                        sku: sku,
                        name: data.title,
                        description: data.description,
                        unit_type: 'PAIR',
                        imgUrl: data.imgUrl,
                        imgFilename: imgFilename,
                        url: link
                    });

                    console.log(`   + Scraped: ${data.title} -> ${sku}`);

                    // Pequeña pausa para no saturar
                    // await sleep(200);

                } catch (e) {
                    console.error(`   ! Error en ${link}:`, e.message);
                }
            }
        } catch (e) {
            console.error(`   ! Error cargando página de colección ${p}:`, e.message);
        }
    }

    await browser.close();

    console.log(`\nTotal scrapeados: ${products.length}`);
    console.log('Descargando imágenes y generando CSV...');

    // 2. Descargar Imágenes y Generar CSV Content
    let csvContent = 'sku,name,description,unit_type,image_filename,source_url\n';

    for (const prod of products) {
        if (prod.imgUrl && prod.imgFilename) {
            const destPath = path.join(IMG_DIR, prod.imgFilename);
            await downloadImage(prod.imgUrl, destPath);
        }

        const line = [
            prod.sku,
            prod.name,
            prod.description,
            prod.unit_type,
            prod.imgFilename,
            prod.url
        ].map(escapeCsv).join(',');

        csvContent += line + '\n';
    }

    // 3. Escribir CSV
    const csvPath = path.join(OUT_DIR, 'productos_agave.csv');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`CSV generado en: ${csvPath}`);

    // 4. Crear ZIP
    console.log('Generando ZIP de imágenes...');
    const outputZip = fs.createWriteStream(path.join(OUT_DIR, 'imagenes_agave.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });

    outputZip.on('close', function () {
        console.log(`ZIP generado en: ${path.join(OUT_DIR, 'imagenes_agave.zip')} (${archive.pointer()} bytes)`);
        console.log('--- PROCESO TERMINADO ---');
    });

    archive.on('error', function (err) {
        throw err;
    });

    archive.pipe(outputZip);
    archive.directory(IMG_DIR, false);
    await archive.finalize();

})();
