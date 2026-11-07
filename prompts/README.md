# Prompts prontos (PT)

Três prompts por tipo de filme. Cada um traz: **objetivo**, **ferramenta indicada**, **prompt para colar** no Claude Code ou no Codex e **como conferir** o resultado.

| Arquivo | Tipo | `escolher.py --tipo` |
|---|---|---|
| [desenho-animado.md](desenho-animado.md) | desenho animado com personagem | `desenho` |
| [clipe-musical.md](clipe-musical.md) | clipe musical | `clipe` |
| [lancamento-produto.md](lancamento-produto.md) | lançamento de produto/projeto | `lancamento` |
| [explicativo.md](explicativo.md) | explicativo narrado, dados | `explicativo`, `dados` |
| [ciencia-3d.md](ciencia-3d.md) | ciência em 3D | `ciencia-3d` |
| [quadro-negro.md](quadro-negro.md) | quadro-negro, matemática, estilo de cinema | `quadro-negro`, `matematica`, `estilo-cinema` |
| [b-roll.md](b-roll.md) | b-roll para vídeo falado | `b-roll` |

## Regras que valem para todos

- **Nada de modelo de vídeo por IA.** Todo quadro sai de código (HTML, Canvas, SVG, Three.js, Python).
- **Voz local.** Se tiver narração, use TTS local (no INEMA: Chatterbox via inemavox). Nenhum TTS por API.
- **Teste curto primeiro.** Peça um trecho de 3–5 s antes do render inteiro.
- **Confira você mesmo.** Cada prompt manda o agente gerar uma folha de quadros (contact sheet) e conferir antes de entregar.
- Os prompts foram escritos a partir de casos públicos de vídeo feito por código ([opus-video-prompts](https://github.com/joeseesun/opus-video-prompts), [awesome-opus5-5-videos](https://github.com/yihui-dev/awesome-opus5-5-videos)) — reescritos e ampliados, não traduzidos ao pé da letra.
