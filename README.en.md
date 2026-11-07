# 🎬 claude-diretor — describe the film, and it picks the tool

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## What it is

Tell it what kind of film you want — animation, music video, product launch, explainer, 3D science, mathematics, blackboard, b-roll — and **claude-diretor** tells you **which tool to use**, **how to install it**, and provides a **ready-to-use prompt in Portuguese** to paste into Claude Code or Codex.

Everything here is **video made with code** (HTML, Canvas, SVG, Three.js, Python), directed by an agent. No AI video models, no API keys: the film is rendered on your machine.

The program and its prompts are in Portuguese.

## What’s inside

| File | What it’s for |
|---|---|
| [`repos.json`](repos.json) | 22 tools in this field: stars, license, stack, film type, weight, GPU, voice, install command, and which INEMA project covers the same use case |
| [`escolher.py`](escolher.py) | asks questions (or accepts flags) and recommends 1 to 3 tools, with reasons |
| [`instalar.sh`](instalar.sh) | clones the selected tool; heavy dependencies are installed only with `--com-deps` |
| [`prompts/`](prompts/) | 3 testable prompts per film type, in PT, each with an objective, tool, prompt, and how to check it |
| [`docs/top10.md`](docs/top10.md) | GitHub top 10 + trending projects |
| [`docs/avaliacao.md`](docs/avaliacao.md) | evaluation of openfilm, brag, and manimgx: is each worth adopting, and for what? |
| [`filmes/`](filmes/) | example films made with these tools (in production) |

## Get started in 1 minute

```bash
git clone https://github.com/inematds/claude-diretor
cd claude-diretor
python3 escolher.py                                   # answers 3 questions
python3 escolher.py --tipo explicativo --gpu nao --voz sim
./instalar.sh hyperframes                             # clones into ~/diretor-repos/hyperframes
```

Types: `desenho`, `clipe`, `lancamento`, `explicativo`, `estilo-cinema`, `ciencia-3d`, `matematica`, `dados`, `b-roll`, `quadro-negro` (`python3 escolher.py --listar`).

Example output:

```text
Filme: Ciência em 3D (por dentro de algo)  (gpu=nao, voz=nao)

1. reel-ciencia-3d  —  https://github.com/inematds/reel-ciencia-3d  (0★, MIT)
   Por quê: reels de ciência 'E se…?' 9:16 em 3D feitos só com código; é a especialidade dela; roda em CPU; projeto INEMA
   Instalar: git clone --depth 1 https://github.com/inematds/reel-ciencia-3d && cd reel-ciencia-3d && npm install
2. manimgx  —  https://github.com/academa-labs/manimgx
...
Prompt pronto em PT: prompts/ciencia-3d.md
```

## The process, from start to finish

Who does what: 🧠 session with you · ⚙️ script · 🤖 `claude -p` / agent (Claude Code or Codex).

| # | Step | Command / action | Who |
|---|---|---|---|
| 1 | Describe the film you want | "I want a 2-minute explainer with narration" | 🧠 |
| 2 | Choose a tool | `python3 escolher.py --tipo explicativo --voz sim` | ⚙️ |
| 3 | Clone the tool | `./instalar.sh <nome>` (clones into `~/diretor-repos/<nome>` or `$DIRETOR_DIR`) | ⚙️ |
| 4 | Install dependencies (if needed) | `./instalar.sh <nome> --com-deps` | ⚙️ |
| 5 | Open the prompt for that type | `prompts/<tipo>.md` → choose 1 of the 3 and change the topic | 🧠 |
| 6 | Ask the agent to make a 3–5 s test | paste the prompt into Claude Code inside the tool’s folder | 🤖 |
| 7 | Review the test | storyboard + the prompt’s “How to check” section | 🧠 |
| 8 | Render the full film | the agent renders it (on CPU, with a memory limit) | 🤖 |
| 9 | Review the finished film | duration with `ffprobe`, storyboard, reading time, transcribed voiceover | 🧠 / ⚙️ |
| 10 | Update the catalog | new stars or a new tool → edit `repos.json` and run `python3 -m unittest discover -s tests` | 🧠 / ⚙️ |

## Golden rules

- **Test short before going long.** Start with 3–5 s, always.
- **Local voice.** Use TTS that runs on your machine for narration; never use TTS through an API.
- **No license = study only.** `instalar.sh` refuses to clone repositories without a license and only shows the link.
- **Dependencies.** `instalar.sh` never runs `npm install`/`pip install` without `--com-deps`.

## Tests

```bash
python3 -m unittest discover -s tests
```

They cover each film type, the GPU and voice filters, interactive mode, JSON output, and `instalar.sh` (refusal to clone a repository without a license, unknown name).

## License

MIT — see [LICENSE](LICENSE). Each listed tool has its own license (the `licenca` field in `repos.json`).

Made by [INEMA](https://inema.club) — open and free content about practical AI.