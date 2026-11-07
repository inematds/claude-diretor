# Desenho animado

## 1. A aventura do fóton

**Objetivo:** curta de 60 s, estilo livro infantil, com um personagem (um fóton) que tem personalidade e ensina física de verdade.

**Ferramenta indicada:** [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase) (traço pintado com p5.brush). Alternativa: [hyperframes](https://github.com/heygen-com/hyperframes) com Canvas.

**Prompt para colar:**

```text
Faça um desenho animado de 60 segundos, do começo ao fim, sozinho. Não pare para me perguntar:
decida e me conte as decisões no final.

Tema: a viagem de um fóton, do centro do Sol até o olho de uma criança na Terra.
Estilo: livro infantil pintado à mão, traço de pincel, cores quentes no Sol e frias no espaço.
O fóton é um personagem: olhos grandes, cara de curioso, reage a cada choque.

Regras:
- Tudo desenhado por código, quadro a quadro (p5.js + p5.brush). Nada de gerador de vídeo por IA.
- Ciência certa: o "passeio aleatório" dentro do Sol tem que ser um passeio aleatório de verdade,
  simulado, não um desenho dele. Mostre números reais (temperatura do núcleo, tempo de saída do Sol,
  8 min e 20 s até a Terra) e diga quando a estimativa é incerta.
- Uma piada visual por cena (onomatopeia, careta, um personagem secundário que volta no fim).
- Narração em português com voz local (TTS que roda nesta máquina). Legenda queimada, grande,
  porque a maioria assiste sem som.
- 1920x1080, 30 fps, exatamente 60 s. Música que muda a cada cena e fica baixa sob a voz.

Antes do render inteiro: renderize 4 s da cena mais difícil e me mostre 6 quadros numa folha.
```

**Como conferir:** folha de quadros com 1 quadro a cada 5 s — o personagem é o mesmo em todos (cor, olhos, tamanho)? Os números aparecem na tela e batem com fonte? A legenda é legível no celular? Duração exata com `ffprobe`.

## 2. A história do Brasil em traço

**Objetivo:** 90 s de linha do tempo animada em traço preto sobre papel, leve e divertida.

**Ferramenta indicada:** [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) (estilos de traço) ou [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion).

**Prompt para colar:**

```text
Faça uma animação de 90 segundos que conta a história do Brasil, de 1500 até hoje, em traço:
desenho de linha preta sobre papel creme, como caderno de esboço. Tom leve, com humor, sem caricatura
ofensiva. Cada época ganha um objeto-símbolo que se desenha na tela (caravela, engenho, café, trem,
Brasília, celular) e se transforma no próximo — sem corte seco.

- Ano grande no canto, contando.
- No máximo 8 palavras por tela; o resto é desenho.
- Música instrumental que acelera perto do presente.
- Tudo em código; nada de imagem gerada por IA.
- 1080x1920 (vertical), 30 fps.

Primeiro me mostre o roteiro em 8 linhas (época → objeto → transição). Depois renderize 5 s e confira
os quadros antes de seguir.
```

**Como conferir:** cada transição nasce do objeto anterior? O ano nunca pula para trás? Folha de quadros a cada 3 s sem tela vazia.

## 3. Mascote que explica

**Objetivo:** mascote animado (robô ou bicho) apresentando uma ideia em 30 s.

**Ferramenta indicada:** [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase).

**Prompt para colar:**

```text
Crie um mascote animado — um robô pequeno, realista no estilo de robô humanoide moderno, nada de
cartoon infantil — que explica em 30 segundos "o que é um agente de IA".

1. Primeiro desenhe a folha do personagem: frente, perfil, 3 expressões (curioso, explicando, feliz).
   Pare e me mostre.
2. Depois anime: ele entra, aponta para 3 ícones que se desenham (ler, decidir, agir), e fecha com
   um gesto. Lábios simples sincronizados com a narração.
3. Narração em PT com voz local; legenda grande embaixo.
4. 1080x1080, 30 fps. Render em CPU, dividido em partes se ficar lento.
```

**Como conferir:** o personagem fica igual à folha em todos os quadros? A boca abre quando há fala e fecha nas pausas? Sem quadro preto entre partes.
