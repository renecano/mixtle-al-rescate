export declare const CARPETAS_SIN_INTERNET: readonly { carpeta: string; tipos: RegExp }[];
export declare function listaSinInternet(carpetaPublica: string, codigo?: { ruta: string; contenido: string | Uint8Array }[]): { ruta: string; bytes: number; rev: string }[];
export declare function archivosEsenciales(paquete: Record<string, unknown>, pantallasAdelantadas?: RegExp): Set<string>;
