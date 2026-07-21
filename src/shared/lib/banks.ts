export interface BankOption {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export const BANKS: BankOption[] = [
  { id: "santander", name: "Santander", logo: "/banks/santander.png", color: "#EC0000" },
  { id: "nubank", name: "Nubank", logo: "/banks/nubank.png", color: "#820AD1" },
  { id: "itau", name: "Itaú", logo: "/banks/itau.jpg", color: "#EC7000" },
  { id: "bradesco", name: "Bradesco", logo: "/banks/bradesco.jpg", color: "#CC092F" },
  { id: "pagbank", name: "PagBank", logo: "/banks/pagbank.svg", color: "#00BFA5" },
  { id: "inter", name: "Inter", logo: "/banks/inter.png", color: "#FF7A00" },
  { id: "banco-do-brasil", name: "Banco do Brasil", logo: "/banks/banco-do-brasil.png", color: "#F8D117" },
  { id: "caixa", name: "Caixa", logo: "/banks/caixa.png", color: "#0066B3" },
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function findBank(value: string | undefined): BankOption | undefined {
  if (!value) return undefined;
  const normalized = normalize(value);
  return BANKS.find((bank) => bank.id === normalized || normalize(bank.name) === normalized);
}
