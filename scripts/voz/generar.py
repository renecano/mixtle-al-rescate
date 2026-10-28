"""Genera (o normaliza, si hay grabación humana) cada frase pedida por generar.mjs.

Uso interno: python generar.py <config.json> <trabajos.json>
Cada trabajo: {"archivo": "...mp3", "texto": "..."} o {"archivo": "...", "grabacion": "ruta"}.
Por cada uno imprime en stdout una línea "LISTO {json}" con su duración en ms.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

from sintesis import a_mp3, generar

config = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
trabajos = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
salida = Path("public/voz")
salida.mkdir(parents=True, exist_ok=True)


def duracion_ms(archivo: Path) -> int:
    info = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-i", str(archivo)], capture_output=True, text=True).stderr
    m = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", info)
    if not m:
        raise RuntimeError(f"No se pudo medir {archivo}")
    h, mi, s = m.groups()
    return round((int(h) * 3600 + int(mi) * 60 + float(s)) * 1000)


for i, t in enumerate(trabajos, 1):
    destino = salida / t["archivo"]
    if "grabacion" in t:
        a_mp3(Path(t["grabacion"]), destino)
        origen = "grabación"
    else:
        generar(config["proveedor"], config["voz"], config["ajustes"], t["texto"], destino)
        origen = config["voz"]
    print(f"[{i}/{len(trabajos)}] {origen}: {t['texto'][:60]}", file=sys.stderr, flush=True)
    print("LISTO " + json.dumps({"archivo": t["archivo"], "ms": duracion_ms(destino)}), flush=True)
