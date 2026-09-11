const formatterBRL = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatarBRL(valor) {
  const num = typeof valor === 'number' ? valor : parseFloat(valor) || 0;
  return formatterBRL.format(num);
}

export function formatarDataBR(dataISO) {
  if (!dataISO || typeof dataISO !== 'string') return '';
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

export function obterDataHojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function obterDataOntemISO() {
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ano = ontem.getFullYear();
  const mes = String(ontem.getMonth() + 1).padStart(2, '0');
  const dia = String(ontem.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
