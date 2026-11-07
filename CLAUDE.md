# CLAUDE.md — claude-diretor

Catálogo + recomendador de ferramentas de vídeo feito por código com agente (sem modelo de vídeo por IA).

## Conta e publicação

- Conta GitHub: **inematds**. Autor de todo commit: `inematds <inematds@gmail.com>` (conferir `git config user.email` antes de commitar).
- Repo público `inematds/claude-diretor`; GitHub Pages na `main`, raiz. Guia (quando houver) vai em `guia/index.html`.
- Publicar = commit + push. Nada de API paga; voz sempre local (Chatterbox via inemavox).

## Estrutura

- `repos.json` — fonte única das ferramentas. Ao mudar: rodar `python3 -m unittest discover -s tests`.
- `escolher.py` — recomendador (stdlib). `TIPOS` liga tipo → prompt em `prompts/`.
- `instalar.sh` — clona em `${DIRETOR_DIR:-~/diretor-repos}`; deps só com `--com-deps`; `so_estudo` nunca clona.
- `prompts/` — 3 prompts por tipo, em PT, adaptados (não copiados).
- `filmes/` — filmes de exemplo; saídas pesadas (mp4 em `saida/`, frames, node_modules) ficam fora do git.
- README em PT/EN/ES: traduções via `~/projetos/wifi/scripts/inema-traduz`. Manter a seção "O processo, do início ao fim" atualizada no mesmo commit que mudar o fluxo.

## Regras

- Nada publicado cita a origem da lista (post de rede social nem o autor dele). Repositórios do GitHub podem ser citados.
- `JohnHeibel/PDoomVideo` não tem licença: só link, nunca código.
- Versionamento: `repos.json` → campo `versao` (minor = XX+1 carregando YY; patch = YY+1).

## Self-learning

When I correct you, or you catch yourself making a mistake: before continuing, add the lesson as a one-line rule at the TOP of the Lessons section below, so it never happens again.

## Lessons
- `instalar.sh` com `set -e`: não terminar o script com `[ teste ] && eco` — se o teste falhar, o código de saída vira 1. Usar `if`. (07/11/2026)
