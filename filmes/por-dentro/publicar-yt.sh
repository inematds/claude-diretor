#!/usr/bin/env bash
# Publica os 2 shorts da série no lives3 (INEMA FTD) — pendente porque o token OAuth do lives3 venceu (07/11/2026).
# Antes: o Nei roda  `cd ~/projetos/yt-pubx && ./yt-pubx auth lives3`  logado na conta do canal.
# Depois:            `bash ~/projetos/claude-diretor/filmes/por-dentro/publicar-yt.sh`
set -euo pipefail
cd ~/projetos/yt-pubx
D=~/projetos/claude-diretor/filmes/por-dentro
./yt-pubx publicar $D/coracao/renders/coracao-por-dentro.mp4 --canal lives3 \
  --plano ~/.local/share/yt-pubx/trabalhos/20261107-131816-coracao-por-dentro-mp4/plano.json < /dev/null
PLANO_JATO=~/.local/share/yt-pubx/trabalhos/20261107-135527-motor-jato-por-dentro-mp4/plano.json
./yt-pubx publicar $D/motor-jato/renders/motor-jato-por-dentro.mp4 --canal lives3 --plano "$PLANO_JATO" < /dev/null
echo "Feito: anote os IDs em $D/PUBLICADO.md e mande os links ao inemaytbot (lives3 · INEMA FTD)."
