#!/usr/bin/env python3
"""claude-diretor — você diz que filme quer, ele diz qual ferramenta usar.

Uso:
  python3 escolher.py                       # perguntas interativas
  python3 escolher.py --tipo explicativo --gpu nao --voz sim
  python3 escolher.py --tipo clipe --json   # saída para scripts
  python3 escolher.py --listar              # tipos disponíveis

Sem dependências: só a biblioteca padrão do Python 3.
"""
import argparse
import json
import math
import os
import sys

RAIZ = os.path.dirname(os.path.abspath(__file__))
REPOS_PADRAO = os.path.join(RAIZ, "repos.json")

TIPOS = {
    "desenho": ("Desenho animado / personagem", "prompts/desenho-animado.md"),
    "clipe": ("Clipe musical", "prompts/clipe-musical.md"),
    "lancamento": ("Lançamento de produto / projeto", "prompts/lancamento-produto.md"),
    "explicativo": ("Vídeo explicativo narrado", "prompts/explicativo.md"),
    "estilo-cinema": ("Estilo de cinema (telejornal, plano-sequência, arte…)", "prompts/quadro-negro.md"),
    "ciencia-3d": ("Ciência em 3D (por dentro de algo)", "prompts/ciencia-3d.md"),
    "matematica": ("Matemática animada", "prompts/quadro-negro.md"),
    "dados": ("Dados e gráficos animados", "prompts/explicativo.md"),
    "b-roll": ("B-roll para vídeo falado (aula, talking head)", "prompts/b-roll.md"),
    "quadro-negro": ("Quadro-negro / quadro branco", "prompts/quadro-negro.md"),
}

SIM_NAO = ("sim", "nao")


def carregar(caminho=REPOS_PADRAO):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)["ferramentas"]


def _pontos(ferr, tipo, voz):
    pos = ferr["tipos"].index(tipo)
    p = 10.0 - 2.5 * pos
    if voz == "sim" and ferr["voz"] == "sim":
        p += 2.0
    if ferr["grupo"] == "inema":
        p += 1.0
    p += float(ferr.get("bonus", 0))
    p += math.log10(ferr.get("estrelas", 0) + 1) / 5.0  # desempate pela comunidade
    return p


def recomendar(tipo, gpu="nao", voz="nao", ferramentas=None, maximo=3):
    """Devolve até `maximo` ferramentas (dicts) com o campo extra `porque`."""
    if tipo not in TIPOS:
        raise ValueError(f"tipo desconhecido: {tipo}. Use um de: {', '.join(TIPOS)}")
    if gpu not in SIM_NAO or voz not in SIM_NAO:
        raise ValueError("gpu e voz aceitam só 'sim' ou 'nao'")
    ferramentas = carregar() if ferramentas is None else ferramentas
    candidatas = []
    for f in ferramentas:
        if f.get("so_estudo") or tipo not in f.get("tipos", []):
            continue
        if gpu == "nao" and f["gpu"] == "sim":
            continue
        if voz == "sim" and f["voz"] == "nao":
            continue
        candidatas.append((_pontos(f, tipo, voz), f))
    candidatas.sort(key=lambda par: -par[0])
    saida = []
    for _, f in candidatas[:maximo]:
        r = dict(f)
        r["porque"] = _porque(f, tipo, gpu, voz)
        saida.append(r)
    return saida


def _porque(f, tipo, gpu, voz):
    partes = [f["resolve"]]
    if f["tipos"][0] == tipo:
        partes.append("é a especialidade dela")
    if f["gpu"] == "nao":
        partes.append("roda em CPU")
    elif f["gpu"] == "opcional" and gpu == "nao":
        partes.append("roda sem GPU (mais lento)")
    if voz == "sim":
        partes.append("já traz narração" if f["voz"] == "sim" else "aceita a sua narração (voz local)")
    outros = [n for n in f["inema"] if n != f["nome"]]
    if f["grupo"] == "inema":
        partes.append("projeto INEMA")
    elif outros:
        partes.append("no INEMA o mesmo é coberto por " + ", ".join(outros))
    return "; ".join(partes)


def caminho_prompt(tipo):
    return TIPOS[tipo][1]


def referencias_estudo(tipo, ferramentas=None):
    """Repos só-estudo ligados ao tipo (ex.: clipe → PDoomVideo, só o link)."""
    ferramentas = carregar() if ferramentas is None else ferramentas
    if tipo != "clipe":
        return []
    return [f for f in ferramentas if f.get("so_estudo") and "clipe" in f["resolve"]]


def perguntar(entrada=input, saida=print):
    nomes = list(TIPOS)
    saida("Que filme você quer?")
    for i, n in enumerate(nomes, 1):
        saida(f"  {i:2d}. {n:14s} {TIPOS[n][0]}")
    tipo = None
    while tipo is None:
        r = entrada("Número ou nome: ").strip().lower()
        if r.isdigit() and 1 <= int(r) <= len(nomes):
            tipo = nomes[int(r) - 1]
        elif r in TIPOS:
            tipo = r
        else:
            saida("Não entendi. Tente de novo.")

    def sn(pergunta):
        while True:
            r = entrada(pergunta + " (s/n): ").strip().lower()
            if r in ("s", "sim", "y"):
                return "sim"
            if r in ("n", "nao", "não", "no", ""):
                return "nao"
            saida("Responda s ou n.")

    gpu = sn("Tem GPU para render (WebGL/WebGPU)?")
    voz = sn("O filme precisa de narração?")
    return tipo, gpu, voz


def formatar(tipo, gpu, voz, recs, estudo):
    linhas = [f"Filme: {TIPOS[tipo][0]}  (gpu={gpu}, voz={voz})", ""]
    if not recs:
        linhas.append("Nenhuma ferramenta atende a esses filtros. Tente --gpu sim ou --voz nao.")
    for i, r in enumerate(recs, 1):
        linhas += [
            f"{i}. {r['nome']}  —  {r['url']}  ({r['estrelas']}★, {r['licenca']})",
            f"   Por quê: {r['porque']}",
            f"   Instalar: {r['instalar']}",
            f"   Ou:       ./instalar.sh {r['nome']}",
            f"   Atenção:  {r['observacoes']}",
            "",
        ]
    for e in estudo:
        linhas.append(f"Para estudar (sem copiar código): {e['url']} — {e['observacoes']}")
    linhas.append(f"Prompt pronto em PT: {caminho_prompt(tipo)}")
    if voz == "sim":
        linhas.append("Voz: use voz local (Chatterbox via inemavox), nunca TTS por API.")
    return "\n".join(linhas)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Recomenda a ferramenta de vídeo por código para o filme que você quer.")
    ap.add_argument("--tipo", choices=list(TIPOS))
    ap.add_argument("--gpu", choices=SIM_NAO, default="nao")
    ap.add_argument("--voz", choices=SIM_NAO, default="nao")
    ap.add_argument("--json", action="store_true", help="saída em JSON")
    ap.add_argument("--listar", action="store_true", help="lista os tipos")
    ap.add_argument("--repos", default=REPOS_PADRAO, help=argparse.SUPPRESS)
    a = ap.parse_args(argv)

    if a.listar:
        for n, (d, p) in TIPOS.items():
            print(f"{n:14s} {d}  →  {p}")
        return 0

    ferramentas = carregar(a.repos)
    if a.tipo:
        tipo, gpu, voz = a.tipo, a.gpu, a.voz
    elif sys.stdin.isatty():
        tipo, gpu, voz = perguntar()
    else:
        ap.error("sem terminal: informe --tipo")

    recs = recomendar(tipo, gpu, voz, ferramentas)
    estudo = referencias_estudo(tipo, ferramentas)
    if a.json:
        print(json.dumps({
            "tipo": tipo, "gpu": gpu, "voz": voz,
            "prompt": caminho_prompt(tipo),
            "recomendacoes": [{k: r[k] for k in ("nome", "url", "porque", "instalar", "licenca", "estrelas")} for r in recs],
            "estudo": [e["url"] for e in estudo],
        }, ensure_ascii=False, indent=2))
    else:
        print(formatar(tipo, gpu, voz, recs, estudo))
    return 0 if recs else 1


if __name__ == "__main__":
    sys.exit(main())
