# B-roll para vídeo falado

## 1. Talking head vira aula em traço

**Objetivo:** pegar um vídeo seu falando para a câmera e trocar o fundo por animação que segue o que você diz.

**Ferramenta indicada:** [video-codigo](https://github.com/inematds/video-codigo) + skill talking-head-b-roll do [motion-skills](https://github.com/iart-ai/motion-skills).

**Prompt para colar:**

```text
Transforme ./aula.mp4 (eu falando para a câmera) em uma nova versão vertical aula-broll.mp4:
1. Eu fico pequeno, num círculo no canto inferior direito, visível mas sem cobrir a legenda.
2. A tela principal vira animação em traço que acompanha a fala: quando eu falo de um conceito,
   o desenho daquele conceito aparece. Leve e divertido, sem realismo.
3. Áudio original, legenda original e duração iguais ao original.
Transcreva primeiro, marque os conceitos com tempo (conceitos.json) e me mostre a lista antes de animar.
```

**Como conferir:** sorteie 3 conceitos do `conceitos.json` e veja se o desenho certo está na tela no tempo marcado. Duração idêntica (`ffprobe` nos dois arquivos).

## 2. Cortes de cobertura para live

**Objetivo:** de uma live longa, gerar b-roll animado só nos trechos em que a tela fica parada.

**Ferramenta indicada:** [hyperframes](https://github.com/heygen-com/hyperframes).

**Prompt para colar:**

```text
Na gravação ./live.mp4, ache os trechos de mais de 8 s em que a imagem quase não muda
(diferença entre quadros baixa). Para cada um, crie um card animado de 4–6 s com a ideia principal
daquele trecho (da transcrição), no estilo preto + amarelo #FACC15, e monte uma versão com esses cards
por cima. Liste os trechos encontrados antes de renderizar.
```

**Como conferir:** os cards entram só nos trechos listados? A voz nunca é cortada?

## 3. Infográfico na palavra certa

**Objetivo:** sobrepor números e ícones a um vídeo falado exatamente quando a palavra é dita.

**Ferramenta indicada:** [video-codigo](https://github.com/inematds/video-codigo) (tempo por palavra).

**Prompt para colar:**

```text
No vídeo ./fala.mp4, transcreva com tempo por palavra. Toda vez que eu falar um número, uma
porcentagem ou o nome de uma ferramenta, mostre na tela por 2 s: o número enorme, ou o nome com
um ícone simples desenhado em código. Entrada exatamente na palavra (± 0,1 s), saída suave.
Gere a lista de ocorrências primeiro.
```

**Como conferir:** para 3 ocorrências, o quadro no tempo da palavra já mostra o elemento? Nada cobre o rosto.
