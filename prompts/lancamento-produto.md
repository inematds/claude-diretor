# Lançamento de produto / projeto

## 1. Acabei o projeto, quero o vídeo

**Objetivo:** vídeo de 20 s que apresenta um projeto de código (ou um guia) com trilha e texto para divulgar.

**Ferramenta indicada:** [brag](https://github.com/latent-spaces/brag) (`/brag-slim`). Alternativa: [hyperframes](https://github.com/heygen-com/hyperframes).

**Prompt para colar (dentro da pasta do projeto):**

```text
/brag-slim --format vertical --duration 20

Leia este projeto (README, código, guia) e faça o vídeo de lançamento:
- Gancho nos 2 primeiros segundos com o ganho para quem usa (não o nome da tecnologia).
- 2 ou 3 destaques, cada um mostrando algo real do projeto (comando, tela, resultado).
- Fecho com o nome e "tudo no inema.club".
- Cores: preto #0c0c10, amarelo #FACC15 só em destaque; títulos em Sora.
- Sem voz; trilha e efeitos discretos, sem whoosh.
- Nunca coloque chaves, e-mails ou caminhos internos na tela.
Entregue também o texto curto para postar.
```

**Como conferir:** o gancho é entendível sem som? Algum segredo/caminho local aparece em algum quadro (folha a cada 1 s)? Duração 20 s ± 0,5.

## 2. Promo cinematográfica de produto

**Objetivo:** 30 s de promo com planos de cinema (close, travelling, revelação) para um app ou produto.

**Ferramenta indicada:** [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) (Remotion) ou [huashu-motion](https://github.com/alchaincyf/huashu-motion).

**Prompt para colar:**

```text
Faça uma promo de 30 s, 1920x1080, do app descrito em ./briefing.md, com capturas em ./telas/.
Monte a lista de planos antes (6 a 8 planos: tipo de plano, movimento de câmera, duração, o que mostra)
e me mostre. Depois renderize. Regras: a tela do app nunca distorce; texto no máximo 6 palavras por plano;
a trilha tem uma virada no plano da revelação; último plano parado 2 s com nome e chamada.
Tudo em código, sem vídeo por IA.
```

**Como conferir:** a lista de planos foi respeitada (compare quadro a quadro)? As capturas estão nítidas (sem upscale borrado)?

## 3. História de um lugar em 45 s

**Objetivo:** motion graphic leve que conta a história de algo (um prédio, uma empresa, uma ferramenta) do começo até hoje, terminando num convite.

**Ferramenta indicada:** [hyperframes](https://github.com/heygen-com/hyperframes) (GSAP).

**Prompt para colar:**

```text
Faça um motion graphic de 30–45 s, estilo explicativo, contando a história do <ASSUNTO> do começo
até hoje: começa com um desenho mínimo (planta, rascunho) e vai se completando até o estado atual.
Marque 4 a 6 datas reais (confira as datas numa fonte e liste as fontes no final da resposta).
Use as imagens da pasta ./imagens. Feche com o convite: "<CHAMADA>".
Anime com GSAP, render em CPU. Se tiver confiança, não pergunte: decida e me conte.
```

**Como conferir:** as datas batem com as fontes listadas? O desenho evolui sem pular etapas?
