export declare function firmas(config: { proveedor: string; voz: string; ajustes: unknown; normalizacion?: Record<string, unknown> }, textoVoz: string, hash: (texto: string) => string): { firma: string; firmaAzure: string };
export declare function configCorto(config: { proveedor: string; voz: string; ajustes: unknown; normalizacion?: Record<string, unknown> }, hash: (texto: string) => string): string;
export declare function nombreDeSalida(clave: string, sufijo: string): string;
export declare function esTextoCorto(texto: string): boolean;
