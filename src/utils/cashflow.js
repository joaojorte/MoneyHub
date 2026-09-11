import { obterDataHojeISO, gerarId } from './formatters';

export function obterDataComDiaAjustado(anoMes, diaDesejado) {
  if (!anoMes || typeof anoMes !== 'string') return obterDataHojeISO();
  const partes = anoMes.split('-');
  if (partes.length < 2) return obterDataHojeISO();

  const ano = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  const diaNum = Math.max(1, Math.min(31, parseInt(diaDesejado, 10) || 10));

  const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
  const diaFinal = Math.min(diaNum, ultimoDiaDoMes);

  return `${ano}-${String(mes).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;
}

export function projetarDataVencimentoCartao(dataCompraISO, diaVencimentoFixo, deslocamentoMeses = 0) {
  let dataBase = dataCompraISO;
  if (!dataBase || typeof dataBase !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataBase)) {
    dataBase = obterDataHojeISO();
  }

  const partes = dataBase.split('-');
  const anoCompra = parseInt(partes[0], 10);
  const mesCompra = parseInt(partes[1], 10);

  const dataAlvo = new Date(anoCompra, (mesCompra - 1) + deslocamentoMeses, 1);
  const anoFinal = dataAlvo.getFullYear();
  const mesFinal = dataAlvo.getMonth() + 1;

  const anoMesStr = `${anoFinal}-${String(mesFinal).padStart(2, '0')}`;
  return obterDataComDiaAjustado(anoMesStr, diaVencimentoFixo);
}

export function gerarLancamentosParcelados({
  descricao,
  valorTotal,
  categoria,
  dataBase,
  formaPagamento = 'cartao_credito',
  diaVencimento = 10,
  quantidadeParcelas = 1,
  detalhamento = '',
  conveniencia = false
}) {
  const qtd = Math.max(1, parseInt(quantidadeParcelas, 10) || 1);
  const total = typeof valorTotal === 'number' ? valorTotal : parseFloat(valorTotal) || 0;
  const valorParcelaBase = Math.floor((total / qtd) * 100) / 100;
  const diferencaCentavos = Math.round((total - (valorParcelaBase * qtd)) * 100) / 100;

  const parcelas = [];
  const idOrigemParcelamento = gerarId();

  for (let i = 0; i < qtd; i++) {
    const numeroParcela = i + 1;
    const valorItem = (i === 0) ? Math.round((valorParcelaBase + diferencaCentavos) * 100) / 100 : valorParcelaBase;
    const dataPagamentoProjetada = projetarDataVencimentoCartao(dataBase, diaVencimento, i);

    const item = {
      id: gerarId(),
      descricao: `${descricao} (${numeroParcela}/${qtd})`,
      descricao_original: descricao,
      valor: valorItem,
      categoria,
      data: dataBase,
      data_pagamento: dataPagamentoProjetada,
      forma_pagamento: formaPagamento,
      frequencia: 'parcelado',
      recorrente: false,
      dia_vencimento: diaVencimento,
      parcelaAtual: numeroParcela,
      totalParcelas: qtd,
      idParcelamento: idOrigemParcelamento
    };

    if (categoria === 'Outros' && detalhamento) {
      item.detalhamento = detalhamento;
    }
    if (categoria === 'Alimentação') {
      item.conveniencia = conveniencia;
    }

    parcelas.push(item);
  }

  return parcelas;
}
