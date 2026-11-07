# Avaliação: openfilm, brag e manimgx (07/11/2026)

Os três foram clonados em `~/projetos/diretor-repos/` e lidos (README, skills, estrutura). Nada foi instalado nem renderizado ainda — a avaliação é de leitura. Comparação com o que o INEMA já usa: **hyperframes** (HTML → vídeo, motor-base) e **video-codigo** (HTML/Canvas → MP4 com voz local presa à palavra).

## openfilm/openfilm — 5,2k★, MIT

**O que é.** Um "agente de vídeo" aberto: o agente (Claude Code, Codex) escreve o filme como `film.html`, com faixas de páginas animadas, imagens e som; cada plano é uma página web com uma função `frame(t)` que desenha qualquer instante (Canvas, SVG, Three.js, WebGL, GSAP). Vem com o **Studio**, um editor local no navegador: mover, trocar texto e cor, cortar na linha do tempo — à mão ou pedindo. CLI: `openfilm open | look | render | get | canvas | doctor`. Node 22.2+, ffmpeg, Chromium baixado na primeira vez (~100 MB). Biblioteca grátis de música, sons, transições e modelos.

**Comparado ao hyperframes / video-codigo.** Mesma ideia (filme = página web renderizada), com duas diferenças reais: (1) `frame(t)` puro em vez de framework — o agente não precisa aprender API nova; (2) o editor humano. O hyperframes tem o registry maior (~450 peças) e já está nas nossas skills; o video-codigo tem a voz local presa à palavra, que o openfilm não tem (a voz dele vem de serviços com chave).

**Vale adotar?** **Sim, como editor de acabamento**, não como motor novo. Uso: quando o Nei quiser mexer à mão num filme pronto (trocar um texto, mover um elemento, aparar um corte) sem pedir de novo ao agente. `openfilm look` (folha de quadros) também serve de verificação. **Não ligar** os serviços de voz/imagem com chave; voz continua local.

## latent-spaces/brag — 20,6k★, MIT

**O que é.** Uma skill (`/brag` e `/brag-slim`) que lê um projeto ou um site e entrega um vídeo de lançamento de ~20 s com trilha, movimento e o texto para divulgar. `/brag` clássico usa HyperFrames e traz música e SFX no pacote; `/brag-slim` é um arquivo só, sem assets, em que o modelo faz tudo com o que há na máquina. Instala como plugin do Claude Code ou do Codex, ou `npx skills add`. Avisa para nunca levar segredo, e-mail ou caminho interno para a tela.

**Comparado ao hyperframes / video-codigo.** É uma camada de **direção** em cima do hyperframes, focada num caso só: "acabei, quero mostrar". Nossas skills de vídeo fazem explicativo e reel; nenhuma lê o repositório e decide sozinha o gancho e os destaques.

**Vale adotar?** **Sim — vídeo de lançamento de cada guia INEMA.** Todo projeto novo tem repo + guia; rodar `/brag-slim --format vertical` na pasta do projeto, com as regras do kit (preto + #FACC15, Sora, sem whoosh), daria um short de lançamento por guia sem roteiro manual. Passo seguinte: piloto num guia já publicado e comparar com o explicavideo que fizemos do mesmo projeto.

## academa-labs/manimgx — 2,6k★, MIT

**O que é.** Motor de animação matemática e 3D com a **API do Manim Community**, mas renderizado em Rust + wgpu: o README mede 36 s de vídeo em 3 s (90× o Manim CE). `pip install manimgx` (Python 3.13+) traz fontes, Typst/LaTeX e o encoder; no Linux, sem GPU, usa o lavapipe (Vulkan em CPU) que vem junto. Roda também no navegador (Pyodide + WebGPU). Traz skill própria (`skills/manimgx`) que ensina o agente a montar a cena, inspecionar o layout e exportar.

**Comparado ao hyperframes / video-codigo.** Não concorre: resolve o que HTML faz mal — fórmula, gráfico de função, geometria, 3D com iluminação física (materiais PBR, oclusão, bloom). No INEMA, o mais próximo é o reel-ciencia-3d (Three.js via hyperframes), que é melhor para objetos e órgãos; manimgx é melhor para matemática e física abstrata.

**Vale adotar?** **Sim, para aulas de matemática/física e cenas 3D abstratas** (campos, órbitas, Fourier). Risco a conferir: rodar em ARM64 (spark-922b) e o desempenho do lavapipe em CPU — testar uma cena de 5 s antes de qualquer plano maior. A saída (MP4) entra no explicavideos/video-codigo como plano, com a narração local por cima.

## Resumo

| Repo | Adotar? | Para quê |
|---|---|---|
| openfilm | sim, como editor | ajuste manual de filme pronto + folha de quadros |
| brag | sim | short de lançamento de cada guia INEMA |
| manimgx | sim, após teste em ARM | matemática, física e 3D abstrato |
