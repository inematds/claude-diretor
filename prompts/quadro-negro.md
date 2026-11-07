# Quadro-negro / quadro branco (matemática e estilo de cinema)

## 1. Aula no quadro-negro

**Objetivo:** explicativo com giz no quadro-negro: o traço se desenha enquanto a voz fala.

**Ferramenta indicada:** [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (estilo quadro-negro). Alternativa: skill de whiteboard do [motion-skills](https://github.com/iart-ai/motion-skills).

**Prompt para colar:**

```text
Use o estilo quadro-negro e faça uma aula de 90 s: "Por que o céu é azul".
- Quadro verde-escuro com textura leve; giz branco e um giz amarelo para o que importa.
- Cada desenho se traça no momento em que a narração fala dele (traço progressivo, não aparece pronto).
- Narração em PT com voz local; confira cada fala com transcrição antes do render.
- O quadro vai enchendo; no fim, a câmera recua e mostra o quadro inteiro como resumo.
- 1920x1080, 30 fps. Teste os primeiros 5 s.
```

**Como conferir:** o traço começa no instante da palavra (± 0,3 s)? O quadro final resume a aula inteira? Texto em giz legível.

## 2. Matemática que se move (Manim)

**Objetivo:** demonstração visual de uma fórmula, no estilo 3Blue1Brown.

**Ferramenta indicada:** [manimgx](https://github.com/academa-labs/manimgx) (rápido, API do Manim) ou [ManimCommunity/manim](https://github.com/ManimCommunity/manim).

**Prompt para colar:**

```text
Com ManimGX, faça uma cena de 45 s que demonstra a fórmula de Bhaskara completando o quadrado
com retângulos coloridos que se movem até formar o quadrado, e os termos da equação que acompanham
cada movimento. Fundo #0c0c10, um destaque #FACC15. Use VGroup/next_to para os rótulos seguirem as
formas. Antes de exportar, inspecione o layout num quadro parado e me mostre. Entregue o .py e o MP4.
```

**Como conferir:** cada passo algébrico na tela corresponde ao movimento geométrico? Nenhum rótulo sobreposto (quadro parado de cada passo).

## 3. Telejornal em código

**Objetivo:** 60 s no estilo de telejornal (vinheta, tarja, mapa, gráfico) sem câmera nem apresentador.

**Ferramenta indicada:** [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (estilo telejornal) ou [onetake](https://github.com/feitangyuan/onetake) para plano-sequência.

**Prompt para colar:**

```text
Faça 60 s no estilo telejornal sobre <NOTÍCIA REAL, com fonte>:
vinheta de 2 s, tarja com a manchete, mapa do local se aproximando, um gráfico com o número principal,
e fecho com a fonte na tela. Preto + amarelo #FACC15, títulos em Sora. Narração com voz local.
Nada de imagem que pareça foto falsa do acontecimento: use mapa, dado e tipografia.
```

**Como conferir:** fonte visível? Números iguais aos da fonte? A tarja nunca cobre o dado principal.
