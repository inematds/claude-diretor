# Como fiz — série "Como funciona por dentro" (reels 9:16 em 3D, só código)

Dois episódios: **1 · Seu coração por dentro** (`coracao/`, 44,9 s) e **2 · Motor a jato por dentro** (`motor-jato/`, 49,4 s).
Motor: [reel-ciencia-3d](https://github.com/inematds/reel-ciencia-3d) (HyperFrames + Three.js, voz local do Nei presa à palavra).
Nada de IA de imagem ou vídeo: os modelos 3D são construídos em código (esfera deformada, tornos, tubos, pás torcidas).

## Pré-requisitos
- `~/projetos/reel-ciencia-3d` (ferramentas `voz.py`, `montar.py`, `mezcla.py`, `preparar.py` e a pasta `motor/`).
- Chatterbox + Whisper do inemavox (voz `nei`), Node 22, ffmpeg.
- O motor **não foi alterado**: cada episódio usa `--projeto <pasta>` e tem a sua camada própria em `js/`.

## O processo, do início ao fim
🧠 sessão · ⚙️ script · 🤖 Claude

1. 🤖 **Fatos primeiro** — `fatos.md` em cada pasta, fonte por número (NHLBI, Texas Heart Institute; NASA Glenn, GE Aerospace). Número sem fonte ficou de fora (lista no fim de cada `fatos.md`).
2. 🤖 **Roteiro** — `roteiro.json` (blocos b0…bN, uma frase por bloco, `tela` e `destaques`). Alvo 30–50 s.
3. ⚙️ **Voz** (GPU, ~9 min cada):
   ```bash
   cd ~/projetos/reel-ciencia-3d
   P=~/projetos/claude-diretor/filmes/por-dentro/coracao      # ou motor-jato
   python3 ferramentas/voz.py --projeto $P $P/roteiro.json
   ```
   Aviso de semelhança < 0,80 por causa de algarismo ("7 .500") é falso alarme; nome próprio ouvido errado (GE9X → "Genovex") **não**: tirei o nome da fala e deixei só na tela.
4. ⚙️ **Relógio + música**:
   ```bash
   python3 ferramentas/montar.py --projeto $P
   python3 ferramentas/mezcla.py --projeto $P --id coracao --musica tranquila   # --id jato no motor
   ```
5. 🤖 **Página e mundo 3D** — `index.html` (com `__FIM__`), `js/mundo.js` (a cena), `js/oficina.js` (peças comuns da série: estúdio com `RoomEnvironment`, câmera por chaves, etiquetas DOM com fio, partículas presas a curva, textura de fibras), `js/por-dentro.css` (camada visual da série), `js/RoomEnvironment.js` (three.js, MIT).
6. ⚙️ `python3 ~/projetos/reel-ciencia-3d/ferramentas/preparar.py --projeto .` (copia o motor, duração, som final).
7. ⚙️ `npx hyperframes check` — 0 erros (o verificador de leitura pediu: texto ≥ 28 px, etiqueta ≥ 0,5 s + 0,3 s/palavra, nada sobreposto).
8. 🤖 **Quadros antes do render** — `npx hyperframes snapshot --at 0,4,8.5,… --no-end -o stills` e olhar o `contact-sheet`. Foram 4 rodadas no coração e 6 no motor (ver "O que mudou olhando os quadros").
9. ⚙️ **Render** (CPU, ~30 min cada; GPU no Chrome sem tela falha nesta máquina):
   ```bash
   systemd-run --user --scope -p MemoryMax=24G npx --yes hyperframes render --output renders/<id>.mp4 --workers 4
   ```
10. 🤖 Quadros do MP4 de verdade (`ffmpeg -ss <t> -i renders/<id>.mp4 -frames:v 1 q.png`), olhar, publicar.
11. ⚙️ Publicar: `yt-pubx publicar <mp4> --contexto "…" --canal lives3 --dry-run` → `--plano <pasta>/plano.json` (short vertical sai sem thumb); `MARCA=FTD REDES=instagram,tiktok ~/projetos/metricool-inematds/publicar.sh <mp4> social-<id>.txt inematds/reel-ciencia-3d`; links no inemaytbot.

## Como cada modelo foi feito
**Coração** (`coracao/js/mundo.js`)
- Casca: `SphereGeometry(160×120)` deformada por `forma()` — ápice afinado, sulco interventricular, sulco AV, dobra entre os átrios, irregularidade por soma de senos. Material físico (clearcoat "molhado", sheen) com textura de fibras feita em canvas.
- **Abrir o coração**: a mesma geometria vira duas metades por planos de corte (z ≤ 0 fica; z ≥ 0 vai numa "porta" com dobradiça e gira 110°). No plano do corte entra uma placa (`ExtrudeGeometry`) com o contorno exato da seção e 2 buracos = átrio ∪ ventrículo de cada lado; atrás de cada buraco, uma tigela (elipsoide `BackSide`) = a câmara.
- Batimento a 70/min: átrios contraem (fase 0–0,15), ventrículos depois (0,17–0,48); a deformação é aplicada por vértice na casca, na placa e nas tigelas, então o corte continua encaixado.
- Válvulas: AV (tricúspide/mitral) = 2 abas presas nas pontas do "pescoço" entre átrio e ventrículo, abrem/fecham pela fase; aórtica/pulmonar = 3 cúspides na raiz do vaso. "TUM" (AV fecha, fase 0,17) e "TÁ" (semilunares fecham, 0,48) piscam no tempo.
- Sangue: partículas instanciadas em curvas Catmull-Rom (azul: cava → AD → VD → artéria pulmonar → pulmões; vermelho: veias pulmonares → AE → VE → aorta), avanço em surto na sístole.
- Sinal elétrico: tubo amarelo crescendo por `setDrawRange` do nó sinoatrial ao nó AV, feixe e ramos, a cada batida.
- Vista de frente: o lado direito da pessoa fica à **esquerda** da tela (nota na tela).

**Motor a jato** (`motor-jato/js/mundo.js`)
- Tudo no eixo x: nacele, cone, casca do núcleo, câmara, bocal = `LatheGeometry` (perfil girado). Pás = plano torcido instanciado (ventilador 16 pás, 10 estágios de compressor cada vez menores, 2+6 de turbina).
- **Corte em quarto**: dois planos com `clipIntersection` (some só onde y > c e z > c), c anima de 2,6 → 0.
- Ar: partículas com cor por posição (frio azul → branco no compressor → laranja na combustão → vermelho na turbina); no compressor andam devagar (o ar se acumula), no bocal rápido. 220 por fora, 170 pelo núcleo.
- Chama: 3 cascas aditivas na câmara, pulsando por soma de senos (sem acaso). Turbina ganha brilho quente quando o fogo acende. Os 2 eixos acendem em amarelo na frase "dois eixos".
- Explodida: cada grupo anda no eixo (ventilador −x, turbina/bocal +x, nacele sobe, eixos descem), etiquetas ASPIRA/COMPRIME/QUEIMA/SOPRA na palavra dita.

## Cores
Vermelho/azul do coração, laranja da chama e metais são **cor de conteúdo**. O amarelo `#FACC15` fica só na interface: título (`em`), números, palavra-chave da legenda, etiqueta em destaque, sinal elétrico e eixos (a coisa principal daquela frase).

## O que mudou olhando os quadros
- Coração: monitor colava no selo da capa → monitor só depois da capa; corte rosa "papelão" → placa mais escura com borda de parede; vista explodida espalhada demais → peças saem 70% e a câmera fica de frente; fonte "lub-dub" ficava na cena do sinal → fonte própria.
- Motor: câmera perto demais (nacele cortada) → recuei 30–60%; texto branco sobre nacele branca → faixa escura atrás de legenda, número e fonte; eixo girando em torno do eixo errado saía da nacele → eixo parado (cilindro liso não mostra giro); explodida saía do quadro → alvo da câmera recentrado.
- Fala do motor tinha 60 s → cortei a frase das pás cerâmicas e o nome "GE9X" da voz (ficou na tela) → 49 s.
