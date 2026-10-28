"""Genera con la voz local actual (Kokoro) las frases de referencia de las muestras de Azure.

Uso interno: python referencia.py <trabajos.json>   (cada trabajo: {"proveedor", "voz", "ajustes", "texto", "destino"})
"""
import json
import sys
from pathlib import Path

from sintesis import generar

for t in json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")):
    generar(t["proveedor"], t["voz"], t["ajustes"], t["texto"], Path(t["destino"]))
    print(f"referencia: {t['texto'][:50]}", file=sys.stderr, flush=True)
