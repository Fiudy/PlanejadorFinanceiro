# Plano de implementação — Landing Editorial do Planejador

## Referência aprovada para planejamento

- Projeto Superdesign: `d7e308cc-a96b-48e3-9da2-406cba446923`
- Draft: `cc9bc205-2301-4bbf-b38f-46b770c60e91`
- Título: **Planejador - Editorial Financial Management**
- Versão analisada: `v1`
- HTML de referência local (ignorado pelo Git): `.superdesign/editorial-financial-management.html`
- Preview: https://p.superdesign.dev/draft/cc9bc205-2301-4bbf-b38f-46b770c60e91

## Objetivo

Substituir a landing atual, composta apenas por header, hero, quatro passos e footer mínimo, pela experiência editorial do draft: header sticky, hero com prova visual do produto, ticker horizontal em GSAP, bento de recursos, resultados, depoimentos, FAQ, CTA final e footer completo.

A implementação deve reutilizar o sistema visual existente, preservar os temas claro/escuro e evitar dependências novas.

## Restrições e decisões técnicas

- React 19 + TypeScript e Tailwind CSS v4 continuam sendo a base.
- Usar `lucide-react`; não incorporar Iconify/CDNs usados pelo HTML do Superdesign.
- Importar GSAP e ScrollTrigger exclusivamente de `src/shared/lib/gsap.ts`.
- Usar `Link` para `/login` e `/registro`; âncoras internas permanecem links nativos.
- Reutilizar `LogoMark`, `Button`, tokens de `src/index.css` e `useThemeStore`.
- Não copiar scripts, Tailwind CDN ou fontes externas presentes no HTML exportado.
- Manter scroll vertical nativo em dispositivos touch e respeitar `prefers-reduced-motion`.
- Garantir contraste nos dois temas; o draft original representa principalmente o tema claro.

## Estrutura proposta

### 1. Composição da página

Refatorar `src/features/landing/components/landing-page.tsx` para atuar apenas como composição das seções:

1. `LandingHeader`
2. `EditorialHero`
3. `HorizontalStoryTicker`
4. `FeatureBento`
5. `OutcomeMetrics`
6. `Testimonials`
7. `LandingFaq`
8. `FinalCta`
9. `LandingFooter`

Manter dados estáticos — recursos, métricas, depoimentos, FAQ e links — em constantes tipadas, fora dos componentes de renderização.

### 2. Componentes novos

Criar em `src/features/landing/components/`:

- `landing-header.tsx`: header sticky de 80px, navegação para `#recursos`, `#resultados` e `#faq`, alternância de tema, Entrar e Começar agora.
- `editorial-hero.tsx`: headline editorial, CTA, prova social validada e mock financeiro responsivo.
- `horizontal-story-ticker.tsx`: seção isolada responsável pelo layout e ciclo de vida do ScrollTrigger.
- `feature-bento.tsx`: grid de 12 colunas no desktop e uma coluna no mobile.
- `outcome-metrics.tsx`: três métricas com numerais monoespaçados.
- `testimonials.tsx`: depoimentos em layout editorial.
- `landing-faq.tsx`: usar `<details>/<summary>` acessíveis, sem estado React desnecessário.
- `final-cta.tsx`: bloco escuro com ação para `/registro`.
- `landing-footer.tsx`: marca, grupos de links e informações legais reais.

Se a fragmentação aumentar excessivamente a navegação do código, combinar seções simples no mesmo arquivo, mantendo o ticker separado por conter lógica de animação.

## Implementação do ticker horizontal

### Desktop

- Renderizar uma única faixa `display: flex`, `flex-wrap: nowrap` e `width: max-content`.
- Preservar a frase como fluxo contínuo, com palavras/blocos e ícones Lucide/SVG inline; não criar slides.
- Medir a distância real: `track.scrollWidth - viewport.clientWidth`.
- Criar `gsap.to(track, { x: -distance, ease: "none" })` com ScrollTrigger.
- Usar pin na seção e `scrub: 1`; calcular `end` com base na distância horizontal.
- Recalcular em `ScrollTrigger.refresh()` quando a viewport ou fontes mudarem.
- Criar a animação dentro de `gsap.context()` e executar `revert()` no cleanup.

### Mobile/touch

- Não fixar a seção nem capturar swipe vertical em `(pointer: coarse)` ou abaixo do breakpoint móvel.
- Exibir a mesma faixa com `overflow-x: auto`, `touch-action: pan-x pan-y`, snap desativado e scrollbar discreta/oculta.
- Manter o documento sem overflow horizontal global.
- Não usar `preventDefault()` em eventos touch.

### Movimento reduzido

- Quando `prefersReducedMotion()` for verdadeiro, não criar ScrollTrigger.
- Mostrar a frase em fluxo horizontal rolável ou permitir quebra controlada, mantendo todo o conteúdo acessível.

## Responsividade

- Header mobile: logo, Entrar e menu compacto; alvos interativos mínimos de 44px.
- Hero: uma coluna no mobile; mock financeiro abaixo do texto; tamanhos fluidos com `clamp()`/classes responsivas.
- Bento: uma coluna no mobile, 12 colunas no desktop; remover rotações que causem clipping em telas estreitas.
- Métricas e depoimentos: empilhar em uma coluna até `md`.
- CTA: reduzir padding e raio em telas pequenas.
- Footer: duas colunas no mobile e seis no desktop, evitando links fictícios clicáveis.
- Adicionar `scroll-mt-24` às seções ancoradas para compensar o header sticky.

## Tema e estilos globais

Atualizar `src/index.css` apenas com utilitários realmente compartilhados:

- estilos específicos do ticker (`landing-ticker-*`), se Tailwind não expressar a medição/estado necessário;
- `scroll-margin-top` ou classes equivalentes para âncoras;
- fallback de movimento reduzido;
- contraste dark para superfícies editoriais claras.

Não alterar os tokens existentes. Mapear os valores do draft para:

- esmeralda: ações e resultados positivos;
- coral: saídas/alertas;
- âmbar: metas e métricas neutras;
- `ink-*`, `paper-*`, `muted-*`: superfícies e texto.

## Conteúdo que precisa de validação

Não publicar como fato até confirmação:

- “+12k usuários ativos”;
- “28% de economia média” e “15min por semana”;
- criptografia “AES-256” e “nível militar”;
- conexão/sincronização com bancos;
- plano Premium, preços e recursos pagos;
- depoimentos e nomes do draft;
- “desde 2024”, razão social e CNPJ `00.000.000/0001-00`;
- links de carreiras, blog, redes sociais e suporte inexistentes.

Antes da implementação final, substituir por conteúdo comprovável, marcar como exemplo visual não publicável ou remover. Rotas inexistentes não devem apontar para `#` silenciosamente.

## Acessibilidade

- Um único `<h1>`; hierarquia sequencial de headings.
- `aria-label` no alternador de tema e menu mobile.
- Navegação móvel com estado expandido (`aria-expanded`) e relação com o painel (`aria-controls`).
- Ícones decorativos com `aria-hidden="true"`.
- FAQ navegável por teclado usando elementos semânticos.
- Foco visível preservado pelos tokens atuais.
- Texto e CTA com contraste WCAG AA nos dois temas.
- O ticker não pode ser a única forma de comunicar informação importante.

## Sequência de execução

1. Validar/substituir claims e links fictícios do draft.
2. Extrair constantes tipadas de conteúdo e montar os componentes estáticos.
3. Implementar header, hero e mock financeiro com rotas reais.
4. Implementar bento, métricas, depoimentos, FAQ, CTA e footer.
5. Implementar o ticker desktop com GSAP context/cleanup e medição por pixels.
6. Adicionar comportamento mobile/touch e fallback de movimento reduzido.
7. Integrar alternância claro/escuro e revisar contrastes.
8. Ajustar âncoras e navegação sticky.
9. Executar build, lint e testes manuais responsivos.

## Verificação

### Automatizada

- `npm.cmd run build`
- `npm.cmd run lint`
- Adicionar testes de componente se uma infraestrutura de testes for introduzida separadamente; não adicionar framework apenas para esta entrega.

### Manual

- 360×800, 390×844, 768×1024, 1280×800 e 1440×900.
- Chrome/Edge desktop e navegador mobile com toque real ou emulação.
- Temas claro e escuro.
- Preferência `prefers-reduced-motion: reduce`.
- Teclado: header, CTAs, FAQ e footer.
- Links `/login`, `/registro` e âncoras internas.
- Entrar/sair da rota `/` repetidamente para confirmar que ScrollTriggers são destruídos e recriados sem duplicação.
- Confirmar ausência de scroll horizontal no `body` em mobile.

## Critérios de aceite

- A página reproduz a direção editorial e todas as seções do draft.
- Não depende de CDN, Iconify ou nova biblioteca.
- O ticker é um fluxo contínuo e funciona sem bloquear scroll vertical.
- Mobile não apresenta clipping, dificuldade de swipe ou overflow global.
- Navegação por âncoras chega à seção correta abaixo do header sticky.
- Claro/escuro têm texto legível e superfícies coerentes.
- Todas as animações têm cleanup e fallback de movimento reduzido.
- Nenhuma claim ou rota fictícia é publicada como real sem validação.
- Build e lint concluem sem erros.

## Arquivos previstos

- Modificar: `src/features/landing/components/landing-page.tsx`
- Criar: componentes de seção em `src/features/landing/components/`
- Modificar: `src/index.css`
- Reutilizar sem mudança provável: `src/shared/ui/button.tsx`, `src/shared/ui/logo.tsx`, `src/shared/lib/gsap.ts`, `src/shared/theme/theme-store.ts`
- Não requer alteração de rota: `src/app/router.tsx` já serve a landing em `/`.
