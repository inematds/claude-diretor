# Falhas

| data | o que quebrou | menor correção | prompt \| infra |
|---|---|---|---|
| 07/11/2026 | por-dentro/motor: fala "mais largo que um Boeing 737" aumentava a fonte (GE diz "que a fuselagem de um 737") | conferir cada frase da voz contra o fatos.md antes da voz; "fuselagem" na voz, tela e texto | prompt |
| 07/11/2026 | por-dentro/motor: nome próprio na voz (GE9X) saiu "Genovex" na legenda | nome só na tela, fora da fala | prompt |
| 07/11/2026 | por-dentro/motor: eixo girando com rotation.y sobre rotation.z saía da nacele | não girar cilindro liso (giro não aparece) | prompt |
| 07/11/2026 | quadro-negro: mux.sh do lemo falhou com o ffmpeg 7.1 do remotion (sem filtros fps/noise) | mux.sh próprio com ffmpeg do sistema (loudnorm 2 passes) | infra |
| 07/11/2026 | quadro-negro: página travou no 1º still (fonte de legenda do demo ausente → document.fonts.load rejeita) | trocar a fonte da legenda antes do 1º teste | infra |
| 07/11/2026 | quadro-negro: Short não subiu (yt-pubx barra título igual no mesmo canal em 48 h) | --title próprio para o Short | prompt |
