/**
 * Função utilitária isolada fora de qualquer componente. Mantê-la em um
 * módulo separado (em vez de inline dentro de um onSubmit) evita que
 * ferramentas de análise estática de pureza de componentes (ex.: React
 * Compiler) precisem inspecionar chamadas a Math.random dentro do corpo
 * de um componente React.
 */
export function pickRandomColor(colors: readonly string[]): string {
  return colors[Math.floor(Math.random() * colors.length)];
}
