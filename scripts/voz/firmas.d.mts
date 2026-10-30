export declare function firmas(config: { proveedor: string; voz: string; ajustes: unknown; normalizacion?: Record<string, unknown> }, textoVoz: string, hash: (texto: string) => string): { firma: string; firmaAzure: string };
export declare function esTextoCorto(texto: string): boolean;
