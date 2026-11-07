# 🎬 claude-diretor — diga o filme, ele escolhe a ferramenta

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

## O que é

Você diz que filme quer — desenho animado, clipe musical, lançamento de produto, explicativo, ciência em 3D, matemática, quadro-negro, b-roll — e o **claude-diretor** diz **qual ferramenta usar**, **como instalar** e entrega um **prompt pronto em português** para colar no Claude Code ou no Codex.

Tudo aqui é **vídeo feito por código** (HTML, Canvas, SVG, Three.js, Python) dirigido por um agente. Nenhum modelo de vídeo por IA, nenhuma chave de API: o filme sai da sua máquina.

## O que tem dentro

| Arquivo | Para quê |
|---|---|
| [`repos.json`](repos.json) | 22 ferramentas da área: estrelas, licença, stack, tipo de filme, peso, GPU, voz, comando de instalação e qual projeto INEMA cobre o mesmo |
| [`escolher.py`](escolher.py) | pergunta (ou recebe flags) e recomenda 1 a 3 ferramentas com o porquê |
| [`instalar.sh`](instalar.sh) | clona a ferramenta escolhida; dependências pesadas só com `--com-deps` |
| [`prompts/`](prompts/) | 3 prompts testáveis por tipo de filme, em PT, cada um com objetivo, ferramenta, prompt e como conferir |
| [`docs/top10.md`](docs/top10.md) | top 10 do GitHub + os que estão em alta |
| [`docs/avaliacao.md`](docs/avaliacao.md) | avaliação de openfilm, brag e manimgx: vale adotar? para quê? |
| [`filmes/`](filmes/) | filmes de exemplo feitos com essas ferramentas (em produção) |

## Começar em 1 minuto

```bash
git clone https://github.com/inematds/claude-diretor
cd claude-diretor
python3 escolher.py                                   # responde 3 perguntas
python3 escolher.py --tipo explicativo --gpu nao --voz sim
./instalar.sh hyperframes                             # clona em ~/diretor-repos/hyperframes
```

Tipos: `desenho`, `clipe`, `lancamento`, `explicativo`, `estilo-cinema`, `ciencia-3d`, `matematica`, `dados`, `b-roll`, `quadro-negro` (`python3 escolher.py --listar`).

Exemplo de saída:

```text
Filme: Ciência em 3D (por dentro de algo)  (gpu=nao, voz=nao)

1. reel-ciencia-3d  —  https://github.com/inematds/reel-ciencia-3d  (0★, MIT)
   Por quê: reels de ciência 'E se…?' 9:16 em 3D feitos só com código; é a especialidade dela; roda em CPU; projeto INEMA
   Instalar: git clone --depth 1 https://github.com/inematds/reel-ciencia-3d && cd reel-ciencia-3d && npm install
2. manimgx  —  https://github.com/academa-labs/manimgx
...
Prompt pronto em PT: prompts/ciencia-3d.md
```

## O processo, do início ao fim

Quem faz: 🧠 sessão com você · ⚙️ script · 🤖 `claude -p` / agente (Claude Code ou Codex).

| # | Passo | Comando / ação | Quem |
|---|---|---|---|
| 1 | Dizer que filme quer | "quero um explicativo de 2 min com narração" | 🧠 |
| 2 | Escolher a ferramenta | `python3 escolher.py --tipo explicativo --voz sim` | ⚙️ |
| 3 | Clonar a ferramenta | `./instalar.sh <nome>` (clona em `~/diretor-repos/<nome>` ou `$DIRETOR_DIR`) | ⚙️ |
| 4 | Instalar dependências (se precisar) | `./instalar.sh <nome> --com-deps` | ⚙️ |
| 5 | Abrir o prompt do tipo | `prompts/<tipo>.md` → escolher 1 dos 3 e trocar o tema | 🧠 |
| 6 | Mandar o agente fazer um teste de 3–5 s | colar o prompt no Claude Code dentro da pasta da ferramenta | 🤖 |
| 7 | Conferir o teste | folha de quadros + o item "Como conferir" do prompt | 🧠 |
| 8 | Render inteiro | o agente renderiza (em CPU, com teto de memória) | 🤖 |
| 9 | Conferir o filme pronto | duração com `ffprobe`, folha de quadros, tempo de leitura, voz transcrita | 🧠 / ⚙️ |
| 10 | Atualizar o catálogo | estrelas novas ou ferramenta nova → editar `repos.json` e rodar `python3 -m unittest discover -s tests` | 🧠 / ⚙️ |

## Regras de ouro

- **Teste curto antes do longo.** 3–5 s primeiro, sempre.
- **Voz local.** Narração com TTS que roda na sua máquina; nunca TTS por API.
- **Sem licença = só estudo.** O `instalar.sh` recusa clonar repositório sem licença e só mostra o link.
- **Peso.** O `instalar.sh` nunca roda `npm install`/`pip install` sem `--com-deps`.

## Testes

```bash
python3 -m unittest discover -s tests
```

Cobrem cada tipo de filme, os filtros de GPU e voz, o modo interativo, a saída JSON e o `instalar.sh` (recusa do repositório sem licença, nome desconhecido).

## Licença

MIT — veja [LICENSE](LICENSE). Cada ferramenta listada tem a sua própria licença (campo `licenca` no `repos.json`).

Feito pelo [INEMA](https://inema.club) — conteúdo aberto e gratuito sobre IA na prática.
