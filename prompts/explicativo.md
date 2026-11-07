# Explicativo narrado (e dados)

## 1. O que é um Transformer, em 2 minutos

**Objetivo:** explicativo narrado sobre um conceito técnico, cenas com uma ideia visual forte cada.

**Ferramenta indicada:** [hyperframes](https://github.com/heygen-com/hyperframes) ou, no INEMA, [video-codigo](https://github.com/inematds/video-codigo) (voz local presa à palavra).

**Prompt para colar:**

```text
Faça em código (JS/HTML) um vídeo explicativo de ~2 min: "O que é um Transformer".
Público: quem nunca programou. 

1. Roteiro primeiro: 6 cenas, cada uma com UMA ideia formal (ex.: palavras viram pontos num mapa;
   atenção = fios que ligam palavras; camadas = empilhar folhas). Me mostre.
2. Narração em PT com voz local; cada elemento entra na tela na palavra que o nomeia.
3. Legenda curta queimada. Números na tela quando houver número na fala.
4. 1920x1080, 30 fps. Paleta: fundo #0c0c10, texto claro, acento #FACC15.
5. Antes do render: confira se cada texto fica na tela o tempo de ler (≥ 0,3 s por palavra).
```

**Como conferir:** tempo de leitura (palavras ÷ segundos na tela); a imagem muda quando a fala muda de assunto; folha de quadros sem tela vazia.

## 2. Circulação da atmosfera (5 min, com legenda bilíngue)

**Objetivo:** aula animada longa sobre um fenômeno físico, com narração e legenda PT/EN.

**Ferramenta indicada:** [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (linha do tempo única de voz + música + legenda) ou [openfilm](https://github.com/openfilm/openfilm).

**Prompt para colar:**

```text
Faça uma aula animada de ~5 min sobre a circulação geral da atmosfera (células de Hadley,
Ferrel e polar; ventos alísios; zonas de chuva e deserto).
- Narração em PT com a voz local desta máquina (veja o script de voz do projeto). Nunca TTS por API.
- Legenda dupla: PT em cima, EN embaixo menor.
- Globo em corte lateral com setas de ar que circulam de verdade (partículas seguindo o campo),
  não setas paradas.
- Uma pergunta para o aluno no fim de cada bloco, com 2 s de pausa.
- Monte tudo numa linha do tempo única (imagem, voz, música, legenda) e confira o tempo de cada fala
  com transcrição antes de renderizar.
Troque o tema para fazer outra aula (ex.: um problema de física) mantendo a estrutura.
```

**Como conferir:** transcreva a narração gerada e compare com o roteiro (palavras faltando?). Legenda PT e EN batem com a fala no mesmo instante.

## 3. Gráfico que conta uma história

**Objetivo:** 45 s mostrando um dado real que muda de opinião (dados animados).

**Ferramenta indicada:** [hyperframes](https://github.com/heygen-com/hyperframes) ou [remotion](https://github.com/remotion-dev/remotion).

**Prompt para colar:**

```text
Pegue o CSV em ./dados.csv e faça 45 s de vídeo vertical que conta UMA história com ele:
1) a pergunta, 2) o palpite comum, 3) o gráfico se desenhando e desmentindo o palpite,
4) o número principal enorme, 5) a fonte na tela.
Gráfico real (eixos, unidade, fonte), barras/linhas crescem com easing e ficam paradas
tempo de ler. Nada de número inventado: tudo vem do CSV.
```

**Como conferir:** sorteie 3 valores do gráfico renderizado e compare com o CSV. A fonte aparece? O gráfico fica parado ≥ 2 s?
