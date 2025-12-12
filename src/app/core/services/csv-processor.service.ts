import { Injectable } from '@angular/core';

export interface CsvData {
    headers: string[];
    rows: string[][];
}

@Injectable({
    providedIn: 'root'
})
export class CsvProcessorService {

    parse(file: File): Promise<CsvData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = reader.result as string;
                    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

                    if (lines.length < 2) {
                        reject(new Error('El archivo CSV debe tener al menos una fila de encabezado y una de datos.'));
                        return;
                    }

                    const headers = lines[0].split(',').map(h => h.trim());
                    const rows = lines.slice(1).map(line => line.split(',').map(f => f.trim()));

                    resolve({ headers, rows });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
}
