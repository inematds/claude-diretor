# Ciência em 3D

## 1. Coração por dentro

**Objetivo:** coração humano em 3D, batendo, com válvulas e fluxo de sangue, virando vídeo de 40 s.

**Ferramenta indicada:** [reel-ciencia-3d](https://github.com/inematds/reel-ciencia-3d) (HyperFrames + Three.js) ou [hyperframes](https://github.com/heygen-com/hyperframes).

**Prompt para colar:**

```text
Construa um coração humano em 3D com Three.js, num HTML só, e transforme em vídeo 1080x1920 de 40 s.
- Músculo vermelho escuro com artérias por cima; dentro: 4 câmaras, 4 válvulas, aorta,
  artéria pulmonar, veias que voltam, e o sistema elétrico que dá o ritmo.
- Bate ~1 vez por segundo; válvulas abrem e fecham no tempo certo; sangue azul entra, vermelho sai
  (partículas seguindo o caminho real).
- Câmera: começa de fora, gira, corta o coração ao meio e entra numa câmara.
- Rótulos curtos que aparecem quando a parte está em foco.
- Iluminação neutra, sem tom amarelado. Render em CPU.
Teste 4 s primeiro e me mostre 6 quadros.
```

**Como conferir:** o sangue nunca atravessa uma válvula fechada? A ordem do fluxo (veias → átrio → ventrículo → artéria) está certa? Rótulos legíveis no celular.

## 2. Turbina desmontada

**Objetivo:** motor a jato em 3D que explode em peças, cada etapa rotulada.

**Ferramenta indicada:** [hyperframes](https://github.com/heygen-com/hyperframes) + Three.js.

**Prompt para colar:**

```text
Faça um motor turbofan em 3D (Three.js) e um vídeo de 45 s que o desmonta:
"aspira, comprime, queima, sopra" — cada etapa com rótulo:
> o fan puxa muito ar; a maior parte desvia do núcleo e faz a maior parte do empuxo
> os compressores apertam o ar ~40 vezes e ele esquenta
> o combustível queima mais quente que o ponto de fusão do metal da turbina
> as pás sobrevivem com ar de resfriamento e revestimento térmico
> dois eixos, um dentro do outro, girando em velocidades diferentes
No fim, explode em todas as etapas, lado a lado. Confira os números numa fonte e cite-as.
```

**Como conferir:** os dois eixos giram em velocidades diferentes? Cada rótulo aparece junto da peça certa?

## 3. Do quarto ao quark

**Objetivo:** zoom contínuo em 6 escalas, sem corte.

**Ferramenta indicada:** [hyperframes](https://github.com/heygen-com/hyperframes) ou [manimgx](https://github.com/academa-labs/manimgx) (3D rápido).

**Prompt para colar:**

```text
Faça um zoom contínuo de 40 s, sem corte: um quarto → um notebook na mesa → o chip do notebook →
um transistor → um átomo de silício → um próton com seus quarks. Cada escala ganha a medida na tela
(1 m, 30 cm, 1 cm, 50 nm, 0,2 nm, 1 fm). A transição acontece "por dentro" do objeto: a câmera entra
num detalhe que vira a próxima cena. Sem marcas registradas na tela.
```

**Como conferir:** a medida diminui sempre (nunca volta)? Não há quadro com corte seco (compare quadros vizinhos nas transições)?
