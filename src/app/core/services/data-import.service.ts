import { Injectable } from '@angular/core';
import { ScmProduct, CsvColumnMapping, ImportPreview } from '../models/erp.types';
import Papa from 'papaparse'; // Cambio en la importación para mejor compatibilidad

@Injectable({
  providedIn: 'root'
})
export class DataImportService {

  constructor() { }

  /**
   * Parsea un archivo CSV para extraer únicamente sus cabeceras.
   * PapaParse lee el archivo directamente, no hace falta leerlo como texto antes.
   */
  public getCsvHeaders(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: 1, // Solo leemos la primera línea
        skipEmptyLines: true,
        complete: (results: any) => {
          // 'meta.fields' contiene los headers detectados
          if (results.meta && results.meta.fields) {
            resolve(results.meta.fields);
          } else {
            reject(new Error('No se encontraron cabeceras en el CSV.'));
          }
        },
        error: (error: any) => reject(error)
      });
    });
  }

  /**
   * Genera una vista previa de los datos importados.
   */
  public generatePreview(file: File, mappings: CsvColumnMapping[], previewCount = 5): Promise<ImportPreview<ScmProduct>> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        preview: previewCount,
        skipEmptyLines: true,
        complete: (results: any) => {
          const previewRows: Partial<ScmProduct>[] = results.data.map((row: any) =>
            this.mapRowToProduct(row, mappings)
          );

          const importPreview: ImportPreview<ScmProduct> = {
            headers: results.meta.fields || [],
            mappings,
            previewRows,
            totalRows: -1, // PapaParse no cuenta el total en modo preview
            errors: results.errors.map((e: any) => e.message)
          };
          resolve(importPreview);
        },
        error: (error: any) => reject(error)
      });
    });
  }

  /**
   * Parsea todo el archivo para obtener los datos finales (Para cuando el usuario da click en "Importar")
   */
  public parseFullFile(file: File, mappings: CsvColumnMapping[]): Promise<Partial<ScmProduct>[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const rows: Partial<ScmProduct>[] = results.data.map((row: any) =>
            this.mapRowToProduct(row, mappings)
          );
          resolve(rows);
        },
        error: (error: any) => reject(error)
      });
    });
  }

  /**
   * Mapea una fila CSV al modelo ScmProduct usando los nombres correctos de la DB.
   */
  private mapRowToProduct(row: Record<string, any>, mappings: CsvColumnMapping[]): Partial<ScmProduct> {
    const product: Partial<ScmProduct> = {};

    mappings.forEach(mapping => {
      // Si la columna tiene un mapeo y existe en la fila del CSV...
      if (mapping.modelProperty && row.hasOwnProperty(mapping.csvHeader)) {
        
        // CORRECCIÓN: Usamos 'keyof ScmProduct' para asegurar que el string sea una propiedad válida
        const key = mapping.modelProperty as keyof ScmProduct;
        const value = row[mapping.csvHeader];

        // Lógica de conversión basada en los nombres REALES de tu interfaz erp.types.ts
        switch (key) {
          case 'purchase_price':
          case 'sale_price':
            const numValue = parseFloat(value);
            // Usamos 'as any' temporalmente para asignar, aunque TypeScript ya debería saber que son numbers
            (product as any)[key] = isNaN(numValue) ? 0 : numValue;
            break;

          case 'is_active':
            // Convertir a booleano
            const boolVal = typeof value === 'string' 
              ? ['true', '1', 'yes', 'si', 's'].includes(value.toLowerCase()) 
              : Boolean(value);
            (product as any)[key] = boolVal;
            break;

          default:
            // Strings directos (sku, name, description, category)
            (product as any)[key] = value;
        }
      }
    });

    return product;
  }
}