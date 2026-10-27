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

        muestras, frecuencia = _kokoro().create(texto, voice=voz, speed=float(ajustes.get("speed", 1.0)), lang="es")
        soundfile.write(str(destino), muestras, frecuencia)
    elif proveedor == "edge":
        import edge_tts

        comunicar = edge_tts.Communicate(texto, voz, rate=ajustes.get("rate", "+0%"), pitch=ajustes.get("pitch", "+0Hz"))
        asyncio.run(comunicar.save(str(destino)))
    else:
        raise ValueError(f"Proveedor desconocido: {proveedor}")


def a_mp3(origen: Path, destino: Path) -> None:
    """MP3 mono a 64 kbps con volumen normalizado (EBU R128), igual para todas las frases."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(origen),
            "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ac", "1", "-ar", "24000", "-b:a", "64k", str(destino),
        ],
        check=True,
    )


def generar(proveedor: str, voz: str, ajustes: dict, texto: str, destino: Path) -> None:
    """Sintetiza `texto` y lo guarda como MP3 normalizado en `destino`."""
    extension = ".mp3" if proveedor == "edge" else ".wav"
    with tempfile.TemporaryDirectory() as carpeta:
        crudo = Path(carpeta) / f"crudo{extension}"
        _sintetizar_crudo(proveedor, voz, ajustes, texto, crudo)
        a_mp3(crudo, destino)
