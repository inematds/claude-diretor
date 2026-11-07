# 🎬 claude-diretor — di la película y elige la herramienta

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## Qué es

Dices qué película quieres hacer — dibujo animado, videoclip musical, lanzamiento de producto, explicativo, ciencia en 3D, matemáticas, pizarra, b-roll — y **claude-diretor** te dice **qué herramienta usar**, **cómo instalarla** y te entrega un **prompt listo en portugués** para pegar en Claude Code o en Codex.

Todo aquí es **video hecho con código** (HTML, Canvas, SVG, Three.js, Python) dirigido por un agente. Ningún modelo de video con IA ni clave de API: la película sale de tu máquina.

El programa y los prompts están en portugués.

## Qué incluye

| Archivo | Para qué sirve |
|---|---|
| [`repos.json`](repos.json) | 22 herramientas del área: estrellas, licencia, stack, tipo de película, peso, GPU, voz, comando de instalación y qué proyecto INEMA cubre lo mismo |
| [`escolher.py`](escolher.py) | pregunta (o recibe flags) y recomienda de 1 a 3 herramientas con su motivo |
| [`instalar.sh`](instalar.sh) | clona la herramienta elegida; las dependencias pesadas solo con `--com-deps` |
| [`prompts/`](prompts/) | 3 prompts comprobables por tipo de película, en PT, cada uno con objetivo, herramienta, prompt y cómo verificar |
| [`docs/top10.md`](docs/top10.md) | top 10 de GitHub + los que están en tendencia |
| [`docs/avaliacao.md`](docs/avaliacao.md) | evaluación de openfilm, brag y manimgx: ¿vale la pena adoptarlos? ¿Para qué? |
| [`filmes/`](filmes/) | películas de ejemplo hechas con estas herramientas (en producción) |

## Empezar en 1 minuto

```bash
git clone https://github.com/inematds/claude-diretor
cd claude-diretor
python3 escolher.py                                   # responde 3 preguntas
python3 escolher.py --tipo explicativo --gpu nao --voz sim
./instalar.sh hyperframes                             # clona en ~/diretor-repos/hyperframes
```

Tipos: `desenho`, `clipe`, `lancamento`, `explicativo`, `estilo-cinema`, `ciencia-3d`, `matematica`, `dados`, `b-roll`, `quadro-negro` (`python3 escolher.py --listar`).

Ejemplo de salida:

```text
Filme: Ciência em 3D (por dentro de algo)  (gpu=nao, voz=nao)

1. reel-ciencia-3d  —  https://github.com/inematds/reel-ciencia-3d  (0★, MIT)
   Por quê: reels de ciência 'E se…?' 9:16 em 3D feitos só com código; é a especialidade dela; roda em CPU; projeto INEMA
   Instalar: git clone --depth 1 https://github.com/inematds/reel-ciencia-3d && cd reel-ciencia-3d && npm install
2. manimgx  —  https://github.com/academa-labs/manimgx
...
Prompt pronto em PT: prompts/ciencia-3d.md
```

## El proceso, de principio a fin

Quién hace cada cosa: 🧠 sesión contigo · ⚙️ script · 🤖 `claude -p` / agente (Claude Code o Codex).

| # | Paso | Comando / acción | Quién |
|---|---|---|---|
| 1 | Decir qué película quieres | "quiero un explicativo de 2 min con narración" | 🧠 |
| 2 | Elegir la herramienta | `python3 escolher.py --tipo explicativo --voz sim` | ⚙️ |
| 3 | Clonar la herramienta | `./instalar.sh <nome>` (clona en `~/diretor-repos/<nome>` o `$DIRETOR_DIR`) | ⚙️ |
| 4 | Instalar dependencias (si hace falta) | `./instalar.sh <nome> --com-deps` | ⚙️ |
| 5 | Abrir el prompt del tipo | `prompts/<tipo>.md` → elegir 1 de los 3 y cambiar el tema | 🧠 |
| 6 | Pedirle al agente que haga una prueba de 3–5 s | pegar el prompt en Claude Code dentro de la carpeta de la herramienta | 🤖 |
| 7 | Revisar la prueba | hoja de cuadros + el apartado "Como conferir" del prompt | 🧠 |
| 8 | Renderizar la película completa | el agente renderiza (en CPU, con límite de memoria) | 🤖 |
| 9 | Revisar la película terminada | duración con `ffprobe`, hoja de cuadros, tiempo de lectura, voz transcrita | 🧠 / ⚙️ |
| 10 | Actualizar el catálogo | nuevas estrellas o herramienta nueva → editar `repos.json` y ejecutar `python3 -m unittest discover -s tests` | 🧠 / ⚙️ |

## Reglas de oro

- **Prueba corta antes que la larga.** Primero 3–5 s, siempre.
- **Voz local.** Narración con TTS que se ejecuta en tu máquina; nunca TTS por API.
- **Sin licencia = solo estudio.** `instalar.sh` se niega a clonar repositorios sin licencia y solo muestra el enlace.
- **Peso.** `instalar.sh` nunca ejecuta `npm install`/`pip install` sin `--com-deps`.

## Pruebas

```bash
python3 -m unittest discover -s tests
```

Cubren cada tipo de película, los filtros de GPU y voz, el modo interactivo, la salida JSON y `instalar.sh` (rechazo del repositorio sin licencia, nombre desconocido).

## Licencia

MIT — consulta [LICENSE](LICENSE). Cada herramienta listada tiene su propia licencia (campo `licenca` en `repos.json`).

Hecho por [INEMA](https://inema.club) — contenido abierto y gratuito sobre IA en la práctica.