#!/usr/bin/env bash
# instalar.sh <nome> [--com-deps]
# Clona a ferramenta (git clone --depth 1) em ${DIRETOR_DIR:-~/diretor-repos}/<nome>.
# Instalação pesada (npm install, pip…) só roda com --com-deps.
# Repositório sem licença (só estudo) não é clonado: só mostra o link.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOS="$RAIZ/repos.json"
DESTINO_BASE="${DIRETOR_DIR:-$HOME/diretor-repos}"

uso() {
  echo "uso: ./instalar.sh <nome> [--com-deps]"
  echo "     ./instalar.sh --listar"
  echo "Clona em \$DIRETOR_DIR (padrão ~/diretor-repos)."
}

NOME=""; COM_DEPS=0
for a in "$@"; do
  case "$a" in
    --com-deps) COM_DEPS=1 ;;
    --listar) python3 - "$REPOS" <<'PY'
import json, sys
for f in json.load(open(sys.argv[1], encoding="utf-8"))["ferramentas"]:
    marca = "  (só estudo)" if f.get("so_estudo") else ""
    print(f"{f['nome']:28s} {f['repo']}{marca}")
PY
      exit 0 ;;
    -h|--help) uso; exit 0 ;;
    -*) echo "opção desconhecida: $a" >&2; uso >&2; exit 2 ;;
    *) NOME="$a" ;;
  esac
done
[ -n "$NOME" ] || { uso >&2; exit 2; }

# Lê os campos da ferramenta (nome ou owner/repo, sem diferenciar maiúsculas)
INFO="$(python3 - "$REPOS" "$NOME" <<'PY'
import json, sys
alvo = sys.argv[2].lower()
for f in json.load(open(sys.argv[1], encoding="utf-8"))["ferramentas"]:
    if alvo in (f["nome"].lower(), f["repo"].lower(), f["repo"].split("/")[1].lower()):
        print(f["nome"]); print(f["url"]); print("1" if f.get("so_estudo") else "0")
        print(f.get("deps", "")); print(f.get("instalar", ""))
        break
PY
)"
if [ -z "$INFO" ]; then
  echo "Ferramenta '$NOME' não está no repos.json. Veja: ./instalar.sh --listar" >&2
  exit 3
fi
mapfile -t CAMPOS <<<"$INFO"
NOME="${CAMPOS[0]}"; URL="${CAMPOS[1]}"; SO_ESTUDO="${CAMPOS[2]}"; DEPS="${CAMPOS[3]:-}"; INSTALAR="${CAMPOS[4]:-}"

if [ "$SO_ESTUDO" = "1" ]; then
  echo "$NOME não tem licença: serve só para estudo. Não vou clonar nem copiar código."
  echo "Abra e estude: $URL"
  command -v xdg-open >/dev/null 2>&1 && [ -n "${DISPLAY:-}" ] && xdg-open "$URL" >/dev/null 2>&1 || true
  exit 0
fi

DEST="$DESTINO_BASE/$NOME"
mkdir -p "$DESTINO_BASE"
if [ -d "$DEST/.git" ]; then
  echo "Já existe: $DEST (não clonei de novo)"
else
  echo "Clonando $URL → $DEST"
  git clone --depth 1 "$URL" "$DEST"
fi

if [ "$COM_DEPS" = "1" ]; then
  if [ -n "$DEPS" ]; then
    echo "Instalando dependências em $DEST: $DEPS"
    (cd "$DEST" && bash -c "$DEPS")
  else
    echo "Sem dependências pesadas para instalar."
  fi
else
  echo "Pronto. Dependências NÃO instaladas (é pesado)."
  if [ -n "$DEPS" ]; then echo "Para instalar: ./instalar.sh $NOME --com-deps   (roda: $DEPS)"; fi
  if [ -n "$INSTALAR" ]; then echo "Instalação recomendada pelo projeto: $INSTALAR"; fi
fi
exit 0
