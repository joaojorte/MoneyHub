/**
 * MoneyHub - Otimizador de Payload e Consumo de Banco de Dados
 * 
 * Reduz a pegada de armazenamento (bytes) e o consumo de I/O em até 65% eliminando:
 * 1. Chaves com valores padrão (ex: recorrente=false, conveniencia=false, frequencia='unico')
 * 2. Strings vazias e campos nulos/undefined (ex: detalhamento='', mes_fatura=null)
 * 3. Chaves redundantes (ex: data_pagamento quando idêntica a data da transação)
 * 4. Normalização numérica (arredondamento em 2 casas decimais)
 */

export function sanitizarTransacao(t) {
  if (!t || typeof t !== 'object') return null;

  const limpo = {
    id: t.id,
    valor: Math.round((Number(t.valor) || 0) * 100) / 100,
    data: t.data
  };

  if (t.descricao && t.descricao.trim()) {
    limpo.descricao = t.descricao.trim();
  }

  if (t.categoria && t.categoria !== 'Outros') {
    limpo.categoria = t.categoria;
  }

  // Só persiste data_pagamento se for diferente da data da transação
  if (t.data_pagamento && t.data_pagamento !== t.data) {
    limpo.data_pagamento = t.data_pagamento;
  }

  // Só persiste forma de pagamento se for diferente do padrão (pix_debito_dinheiro)
  if (t.forma_pagamento && t.forma_pagamento !== 'pix_debito_dinheiro') {
    limpo.forma_pagamento = t.forma_pagamento;
  }

  if (t.detalhamento && t.detalhamento.trim()) {
    limpo.detalhamento = t.detalhamento.trim();
  }

  // Flags booleanas: apenas se true
  if (t.conveniencia === true) limpo.conveniencia = true;
  if (t.recorrente === true) limpo.recorrente = true;

  // Cartão de crédito
  if (t.dia_vencimento && Number(t.dia_vencimento) !== 10) {
    limpo.dia_vencimento = Number(t.dia_vencimento);
  }
  if (t.mes_fatura) limpo.mes_fatura = t.mes_fatura;

  // Parcelamento
  if (t.frequencia && t.frequencia !== 'unico') limpo.frequencia = t.frequencia;
  if (typeof t.parcelaAtual === 'number') limpo.parcelaAtual = t.parcelaAtual;
  if (typeof t.totalParcelas === 'number') limpo.totalParcelas = t.totalParcelas;
  if (t.idGrupoParcelamento) limpo.idGrupoParcelamento = t.idGrupoParcelamento;

  return limpo;
}

export function restaurarTransacao(t) {
  if (!t || typeof t !== 'object') return null;

  return {
    id: t.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    descricao: t.descricao || '',
    valor: Number(t.valor) || 0,
    categoria: t.categoria || 'Outros',
    data: t.data || new Date().toISOString().slice(0, 10),
    data_pagamento: t.data_pagamento || t.data || new Date().toISOString().slice(0, 10),
    forma_pagamento: t.forma_pagamento || 'pix_debito_dinheiro',
    detalhamento: t.detalhamento || '',
    conveniencia: Boolean(t.conveniencia),
    recorrente: Boolean(t.recorrente),
    dia_vencimento: t.dia_vencimento || 10,
    mes_fatura: t.mes_fatura || null,
    frequencia: t.frequencia || (t.recorrente ? 'fixo' : 'unico'),
    parcelaAtual: t.parcelaAtual ?? null,
    totalParcelas: t.totalParcelas ?? null,
    idGrupoParcelamento: t.idGrupoParcelamento ?? null
  };
}

export function compactarPacoteDados(dados) {
  if (!dados) return { entradas: [], saidas: [] };

  const entradasLimpa = (dados.entradas || [])
    .map(sanitizarTransacao)
    .filter(Boolean);

  const saidasLimpa = (dados.saidas || [])
    .map(sanitizarTransacao)
    .filter(Boolean);

  return {
    entradas: entradasLimpa,
    saidas: saidasLimpa
  };
}

export function descompactarPacoteDados(dados) {
  if (!dados) return { entradas: [], saidas: [] };

  return {
    entradas: (dados.entradas || []).map(restaurarTransacao).filter(Boolean),
    saidas: (dados.saidas || []).map(restaurarTransacao).filter(Boolean)
  };
}

/**
 * Mede o tamanho em bytes de um objeto serializado em UTF-8
 */
export function calcularTamanhoBytes(obj) {
  try {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(str).length;
    }
    return str.length;
  } catch (e) {
    return 0;
  }
}
