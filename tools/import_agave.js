const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ERP_URL = 'http://localhost:4200';
const AGAVE_BASE = 'https://www.agaveboots.com.mx/collections/all';
const TEMP_DIR = path.join(__dirname, 'temp_images');

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve(false);
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => resolve(true));
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            resolve(false);
        });
    });
}

(async () => {
    console.log('Iniciando script de importación MEJORADO...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // Capturar logs del navegador
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // 1. Scrape Products
    const products = [];
    console.log('Comenzando scraping de Agave Boots (Páginas 1-4)...');

    // Solo hacemos scraping de 2 productos por página para prueba rápida si el usuario quiere, 
    // pero el requerimiento es TODOS. Dejaremos el loop completo pero añadiremos logs.
    for (let p = 1; p <= 4; p++) {
        console.log(`--- Procesando página ${p} ---`);
        try {
            await page.goto(`${AGAVE_BASE}?page=${p}`, { waitUntil: 'domcontentloaded', timeout: 60000 });

            const links = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a[href*="/products/"]'));
                return [...new Set(anchors.map(a => a.href))];
            });

            console.log(`Encontrados ${links.length} enlaces en página ${p}.`);

            for (const link of links) {
                try {
                    // Ir a producto
                    await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });

                    const product = await page.evaluate(() => {
                        const title = document.querySelector('h1')?.innerText.trim() || '';
                        // Intentar varios selectores de descripción
                        let description = document.querySelector('.product-description')?.innerText.trim() ||
                            document.querySelector('.rte')?.innerText.trim() ||
                            '';
                        // Limitar descripción para no saturar
                        if (description.length > 500) description = description.substring(0, 500) + '...';

                        const imgMeta = document.querySelector('meta[property="og:image"]');
                        let imgUrl = imgMeta ? imgMeta.content : '';
                        if (imgUrl && imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;

                        return { title, description, imgUrl };
                    });

                    if (product.title) {
                        products.push({ ...product, url: link });
                        console.log(`Scraped OK: ${product.title}`);
                    }
                } catch (e) {
                    console.error(`Error scraping link ${link}:`, e.message);
                }
            }
        } catch (e) {
            console.error(`Error cargando página ${p}:`, e.message);
        }
    }

    console.log(`Total productos encontrados: ${products.length}`);

    // 2. Login to ERP
    console.log('Navegando al ERP...');
    await page.goto(ERP_URL, { waitUntil: 'networkidle0' });

    console.log('Intentando Login...');
    try {
        await page.waitForSelector('#email', { timeout: 5000 });
        await page.type('#email', 'admin@mi-erp.com');
        await page.type('#password', '123456');
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('Login enviado.');
    } catch (e) {
        console.log('Es posible que ya estés logueado o haya fallado el login.', e.message);
    }

    // Esperar a que cargue el dashboard o selector de empresas
    await sleep(2000);

    // Seleccionar empresa
    console.log('Buscando empresa "Agave Boots"...');
    try {
        // Buscar texto en el body para asegurar carga
        await page.waitForFunction(() => document.body.innerText.length > 0);

        const found = await page.evaluate(() => {
            const els = Array.from(document.querySelectorAll('button, a, div')); // Elementos clickeables genericos
            // Buscar el que tenga exactamente o contenga agave boots
            const target = els.find(el => el.innerText && el.innerText.toLowerCase().includes('agave boots'));
            if (target) {
                target.click();
                return true;
            }
            return false;
        });

        if (found) {
            console.log('Empresa seleccionada.');
            await sleep(3000); // Esperar carga de dashboard
        } else {
            console.log('No se encontró botón explícito de empresa, asumiendo que ya estamos dentro o es la única.');
        }
    } catch (e) {
        console.log('Error seleccionando empresa (no crítico si ya estamos dentro):', e.message);
    }

    // 3. Importar Productos
    for (const [index, p] of products.entries()) {
        console.log(`\n[${index + 1}/${products.length}] Procesando: ${p.title}`);

        try {
            await page.goto(`${ERP_URL}/inventory/new`, { waitUntil: 'networkidle0' });
            await sleep(1000); // Esperar renderizado completo de Angular

            // Verificar formulario vacío
            const existingName = await page.$eval('input[formControlName="name"]', el => el.value);
            if (existingName) {
                console.log('Advertencia: El formulario no estaba vacío. Limpiando...');
                await page.goto(`${ERP_URL}/inventory`, { waitUntil: 'networkidle0' });
                await sleep(500);
                await page.goto(`${ERP_URL}/inventory/new`, { waitUntil: 'networkidle0' });
            }

            const typeValue = async (selector, value) => {
                const el = await page.$(selector);
                if (!el) throw new Error(`Selector ${selector} no encontrado`);

                // Click 3 veces para seleccionar todo y borrar
                await el.click({ clickCount: 3 });
                await el.type(value);
            };

            const sku = 'AGV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            await typeValue('input[formControlName="sku"]', sku);
            await typeValue('input[formControlName="name"]', p.title);

            // Descripción (textarea) check
            const descInput = await page.$('textarea[formControlName="description"]');
            if (descInput) await typeValue('textarea[formControlName="description"]', p.description);

            // Unit Type PAIR
            await page.select('select[formControlName="unit_type"]', 'PAIR');

            // Imagen
            if (p.imgUrl) {
                const ext = path.extname(p.imgUrl.split('?')[0]) || '.jpg';
                const localPath = path.join(TEMP_DIR, `img_${index}${ext}`);
                console.log(`   Descargando imagen: ${p.imgUrl}...`);
                const downloaded = await downloadImage(p.imgUrl, localPath);

                if (downloaded) {
                    const inputUpload = await page.$('input[type="file"]');
                    if (inputUpload) {
                        await inputUpload.uploadFile(localPath);
                        console.log('   Imagen subida al input.');
                        await sleep(1500); // Esperar preview
                    }
                }
            }

            // GUARDAR
            console.log('   Guardando...');
            const submitBtn = await page.$('button[type="submit"]');
            // Verificar que no esté disabled
            const isDisabled = await page.$eval('button[type="submit"]', btn => btn.disabled);

            if (isDisabled) {
                console.error('   BOTÓN GUARDAR DESHABILITADO. Formulario inválido.');
                // Intentar ver error logs en pantalla si es posible, o continuar
                continue;
            }

            await submitBtn.click();

            // CONFIRMACIÓN
            console.log('   Esperando confirmación...');
            try {
                // Opción A: Esperar navegación a /inventory (si el componente redirige)
                // Opción B: Esperar Toast de éxito (contiene "éxito" o "creado")

                // Voy a esperar cualquiera de los dos.
                // En product-form.component.ts: this.router.navigate(['/inventory']);

                await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle0' });
                console.log('   CONFIRMADO: Redirección detectada.');
            } catch (navError) {
                console.log('   No hubo redirección rápida. Buscando mensaje toast...');
                // Si no redirige rápido, quizás mostró un error o tardó.
                // Intentar buscar texto de éxito
                try {
                    await page.waitForFunction(() => {
                        return document.body.innerText.includes('creado') ||
                            document.body.innerText.includes('éxito') ||
                            document.body.innerText.includes('success');
                    }, { timeout: 5000 });
                    console.log('   CONFIRMADO: Mensaje de éxito detectado.');
                } catch (toastError) {
                    console.error('   NO SE DETECTÓ CONFIRMACIÓN. Puede haber fallado.');
                }
            }

            await sleep(1000);

        } catch (err) {
            console.error(`   CRITICAL FAILURE en producto ${p.title}:`, err.message);
        }
    }

    console.log('--- PROCESO COMPLETADO ---');
    // await browser.close(); 
})();
