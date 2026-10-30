"""Síntesis de voz con Piper, Kokoro o edge-tts, y conversión a MP3 mono 64 kbps normalizado.

Lo usan muestras.py (para elegir la voz) y, más adelante, el generador de todas las frases.
"""
from __future__ import annotations

import asyncio
import subprocess
import tempfile
import wave
from functools import lru_cache
from pathlib import Path

import imageio_ffmpeg

MODELOS = Path(".voz-modelos")


@lru_cache(maxsize=None)
def _piper(voz: str):
    from piper import PiperVoice

    return PiperVoice.load(str(MODELOS / f"{voz}.onnx"))


@lru_cache(maxsize=1)
def _kokoro():
    from kokoro_onnx import Kokoro

    return Kokoro(str(MODELOS / "kokoro-v1.0.int8.onnx"), str(MODELOS / "voices-v1.0.bin"))


def _sintetizar_crudo(proveedor: str, voz: str, ajustes: dict, texto: str, destino: Path) -> None:
    """Genera el audio sin procesar en `destino` (wav o mp3 según el proveedor)."""
    if proveedor == "piper":
        from piper import SynthesisConfig

        config = SynthesisConfig(length_scale=float(ajustes.get("length_scale", 1.0)))
        modelo = _piper(voz)  # se carga antes de abrir el wav para que un error de carga no quede oculto
        with wave.open(str(destino), "wb") as wav:
            modelo.synthesize_wav(texto, wav, syn_config=config)
    elif proveedor == "kokoro":
        import soundfile

        # lang "es-419": español latinoamericano (seseo), como se habla en México; "es" pronuncia z/ce/ci como en España.
        muestras, frecuencia = _kokoro().create(texto, voice=voz, speed=float(ajustes.get("speed", 1.0)), lang=ajustes.get("lang", "es-419"))
        soundfile.write(str(destino), muestras, frecuencia)
    elif proveedor == "edge":
        import edge_tts

        comunicar = edge_tts.Communicate(texto, voz, rate=ajustes.get("rate", "+0%"), pitch=ajustes.get("pitch", "+0Hz"))
        asyncio.run(comunicar.save(str(destino)))
    else:
        raise ValueError(f"Proveedor desconocido: {proveedor}")


def filtro_recorte(normalizacion: dict | None) -> str:
    """Recorte de silencio (voz.config.json, "normalizacion"): quita el del inicio y del final dejando
    `bordeS`, y acorta las pausas internas de más de `pausaMaximaS` a `pausaS`. Silencio = por debajo
    de `umbralDb`. Va antes de loudnorm, para que el silencio no estorbe su medición. Vacío si no hay."""
    if not normalizacion:
        return ""
    n = {k: v for k, v in normalizacion.items() if not k.startswith("$")}
    umbral = f"{n['umbralDb']}dB"
    inicio = f"silenceremove=start_periods=1:start_threshold={umbral}:start_silence={n['bordeS']}"
    return (
        f"{inicio}:stop_periods=-1:stop_duration={n['pausaMaximaS']}:stop_threshold={umbral}:stop_silence={n['pausaS']},"
        f"areverse,{inicio},areverse,"
    )


def a_mp3(origen: Path, destino: Path, normalizacion: dict | None = None) -> None:
    """MP3 mono a 64 kbps, con el silencio recortado (si se pide) y el volumen normalizado (EBU R128),
    igual para todas las frases, vengan del proveedor que vengan o de una grabación humana."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(origen),
            "-af", filtro_recorte(normalizacion) + "loudnorm=I=-16:TP=-1.5:LRA=11", "-ac", "1", "-ar", "24000", "-b:a", "64k", str(destino),
        ],
        check=True,
    )


def generar(proveedor: str, voz: str, ajustes: dict, texto: str, destino: Path, normalizacion: dict | None = None) -> None:
    """Sintetiza `texto` y lo guarda como MP3 normalizado en `destino`."""
    extension = ".mp3" if proveedor == "edge" else ".wav"
    with tempfile.TemporaryDirectory() as carpeta:
        crudo = Path(carpeta) / f"crudo{extension}"
        _sintetizar_crudo(proveedor, voz, ajustes, texto, crudo)
        a_mp3(crudo, destino, normalizacion)
