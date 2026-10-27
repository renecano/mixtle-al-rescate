"""Genera las muestras de voz para elegir: las mismas frases con cada opción de muestras.json."""
import json
import sys
import time
from pathlib import Path

from sintesis import generar

config = json.loads(Path("scripts/voz/muestras.json").read_text(encoding="utf-8"))
salida = Path("docs/muestras-voz")
fallas = []
for opcion in config["opciones"]:
    for frase in config["frases"]:
        destino = salida / f"{opcion['id']}-{frase['id']}.mp3"
        inicio = time.time()
        try:
            generar(opcion["proveedor"], opcion["voz"], opcion["ajustes"], frase["texto"], destino)
            print(f"✓ {destino.name} ({time.time() - inicio:.1f} s)")
        except Exception as error:  # una voz que falla no detiene las demás
            fallas.append(f"{destino.name}: {error}")
            print(f"✗ {destino.name}: {error}")

if fallas:
    print("\nNo se pudieron generar:\n" + "\n".join(fallas))
    sys.exit(1)
