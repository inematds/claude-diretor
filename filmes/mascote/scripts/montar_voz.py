"""Recoloca as 3 frases da voz (voz/mascote) nos instantes do filme → voz/filme/voz.wav + tiempos.json/js deslocados.
Uso: python3 scripts/montar_voz.py   (rodar na pasta do filme)"""
import json, pathlib, subprocess
import numpy as np

SR = 48000
DUR = 17.6
INICIO = {"hook": 0.5, "meio": 9.2, "fecho": 14.0}   # onde cada frase começa no filme (s)

src = pathlib.Path("voz/mascote"); dst = pathlib.Path("voz/filme"); dst.mkdir(parents=True, exist_ok=True)
T = json.loads((src / "tiempos.json").read_text())
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(src / "voz.wav"), "-f", "f64le", "-ac", "1", "-ar", str(SR), "-"],
                     capture_output=True, check=True).stdout
v = np.frombuffer(raw, dtype=np.float64)
out = np.zeros(int(DUR * SR))
desl = {}
for f in T["frases"]:
    a, b = max(0, f["inicio"] - .05), min(len(v) / SR, f["fin"] + .12)
    d = INICIO[f["id"]] - f["inicio"]; desl[f["id"]] = d
    seg = v[int(a * SR):int(b * SR)].copy()
    n = int(.02 * SR); seg[:n] *= np.linspace(0, 1, n); seg[-n:] *= np.linspace(1, 0, n)
    i0 = int((a + d) * SR); out[i0:i0 + len(seg)] += seg
for f in T["frases"]: f["inicio"] += desl[f["id"]]; f["fin"] += desl[f["id"]]
for p in T["palabras"]: p["inicio"] += desl[p["frase"]]; p["fin"] += desl[p["frase"]]
for b in T["bloques"]:
    fr = [f for f in T["frases"] if f["bloque"] == b["id"]]; b["inicio"] = fr[0]["inicio"]; b["fin"] = fr[-1]["fin"]
T["duracion"] = DUR; T["id"] = "filme"
(dst / "tiempos.json").write_text(json.dumps(T, ensure_ascii=False, indent=1))
js = "window.TIEMPOS=" + json.dumps(T, ensure_ascii=False) + ";\n"
(dst / "tiempos.js").write_text(js); pathlib.Path("assets/tiempos.js").write_text(js)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", str(dst / "voz.wav")],
               input=out.astype(np.float64).tobytes(), check=True)
print({k: round(x, 3) for k, x in desl.items()}, [(p["texto"], round(p["inicio"], 2)) for p in T["palabras"]])
