# Clipe musical

## 1. Clipe pintado com a letra no tempo

**Objetivo:** clipe de uma música (sua ou livre de direitos) com pinceladas que reagem ao som e a letra aparecendo na hora certa.

**Ferramenta indicada:** [functional-emotions-video](https://github.com/ledbetterljoshua/functional-emotions-video) (precisa de GPU). Sem GPU: [hyperframes](https://github.com/heygen-com/hyperframes) com Canvas 2D.

**Prompt para colar:**

```text
Tenho a música em ./musica.mp3 (direitos liberados). Faça um clipe pintado:

1. Separe a voz do instrumental, transcreva a letra e alinhe palavra por palavra com o tempo.
   Salve em letra.json e me mostre as 10 primeiras palavras com tempo.
2. Extraia batida, energia e graves por quadro (features.json).
3. Visual: pinceladas a óleo que se movem com os graves; a cor muda no refrão; a letra aparece
   escrita à mão, palavra por palavra, exatamente quando é cantada.
4. Tudo em código (WebGL ou Canvas). Nada de vídeo gerado por IA.
5. 1920x1080, 30 fps, a duração da música.

Teste com os primeiros 5 s antes do render inteiro.
```

**Como conferir:** pegue 3 palavras ao acaso no `letra.json` e veja se o quadro daquele instante mostra a palavra. Pinceladas mudam no refrão? Áudio e imagem com a mesma duração (`ffprobe`).

## 2. Tipografia que constrói o chão

**Objetivo:** 20 s de poema falado encenado só com tipografia, em que as palavras viram estrutura (viga, cabo, piso).

**Ferramenta indicada:** [hyperframes](https://github.com/heygen-com/hyperframes) (SVG + GSAP).

**Prompt para colar:**

```text
Faça um filme de 20 segundos, 1080x1080, só com tipografia, chamado "CONSTRUIR O CHÃO".
Texto exato, nesta ordem:
"Mandaram a gente esperar." / "A gente aprendeu o peso da espera." / "Aí uma voz abriu espaço." /
"Depois outra." / "Agora o chão é nosso."

Regra central: cada palavra-chave tem papel de arquitetura. ESPERAR é uma viga em cima.
ESPERA é uma carga pendurada. VOZ é um pilar. ESPAÇO é uma abertura. CHÃO é a plataforma
onde a última frase fica de pé. Os papéis saem das próprias letras, não de desenhos atrás do texto.

Cores: fundo #0c0c10, texto #F4F1EA, destaque #FACC15. Serifa forte para a fala,
grotesca pesada para as palavras que sustentam. Nada de megafone, bandeira ou multidão.
Trilha percussiva que bate nos encaixes. Tudo legível sem som.

Mostre a decupagem (tempo de cada frase) antes; depois 4 s de teste.
```

**Como conferir:** a frase final está apoiada no CHÃO feito pelas palavras anteriores? Cada frase fica na tela tempo suficiente para ler (≥ 1,5 s por linha)?

## 3. Visualizador de batida

**Objetivo:** clipe simples e bonito para música instrumental, com formas que respondem ao som.

**Ferramenta indicada:** [hyperframes](https://github.com/heygen-com/hyperframes).

**Prompt para colar:**

```text
Faça um clipe 1080x1920 para ./trilha.mp3: círculos concêntricos que pulsam com o grave,
linhas finas que reagem aos agudos e uma mudança de paleta em cada seção da música
(detecte as seções pela energia). Fundo escuro, um único acento amarelo #FACC15.
Analise o áudio primeiro e salve os tempos das seções. Nada de vídeo por IA. Teste 5 s.
```

**Como conferir:** a paleta muda exatamente nos tempos das seções detectadas? Nenhum quadro estourado (branco puro em tela cheia)?
