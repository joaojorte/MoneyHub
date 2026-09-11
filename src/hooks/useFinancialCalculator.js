import { useState, useMemo, useEffect } from 'react';
import {
  PERCENTUAL_INVESTIMENTO_PADRAO,
  PERCENTUAL_RESERVA_PADRAO,
  STORAGE_KEYS
} from '../utils/constants';
import { obterDataHojeISO, gerarId } from '../utils/formatters';

export function useFinancialCalculator(entradas = [], saidas = []) {
  const [percentualInvestimento, setPercentualInvestimento] = useState(PERCENTUAL_INVESTIMENTO_PADRAO);
  const [percentualReserva, setPercentualReserva] = useState(PERCENTUAL_RESERVA_PADRAO);
  const [aporteExtra, setAporteExtra] = useState('');
  
  const [historicoInvestimentos, setHistoricoInvestimentos] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.INVESTIMENTOS);
      return salvo ? JSON.parse(salvo) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVESTIMENTOS, JSON.stringify(historicoInvestimentos));
    } catch (e) {}
  }, [historicoInvestimentos]);

  const mesAtual = useMemo(() => obterDataHojeISO().slice(0, 7), []);

  const totalEntradas = useMemo(() => {
    return entradas.reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0);
  }, [entradas]);

  // Considera saídas vigentes no mês atual e assinaturas projetadas
  const totalSaidas = useMemo(() => {
    return saidas.reduce((acc, item) => {
      const dataRef = item.data_pagamento || item.data || '';
      const mesItem = dataRef.slice(0, 7);
      if (mesItem === mesAtual || item.recorrente === true) {
        return acc + (parseFloat(item.valor) || 0);
      }
      return acc;
    }, 0);
  }, [saidas, mesAtual]);

  const numAporteExtra = useMemo(() => {
    const val = parseFloat(aporteExtra);
    return isNaN(val) ? 0 : Math.max(0, val);
  }, [aporteExtra]);

  const sobraReal = useMemo(() => {
    return Math.max(0, totalEntradas - totalSaidas);
  }, [totalEntradas, totalSaidas]);

  const baseCalculo = useMemo(() => {
    return sobraReal + numAporteExtra;
  }, [sobraReal, numAporteExtra]);

  const investimentoRecomendado = useMemo(() => {
    return Math.max(0, baseCalculo * (percentualInvestimento / 100));
  }, [baseCalculo, percentualInvestimento]);

  const reservaRecomendada = useMemo(() => {
    return Math.max(0, baseCalculo * (percentualReserva / 100));
  }, [baseCalculo, percentualReserva]);

  const livreRecomendado = useMemo(() => {
    return Math.max(0, baseCalculo - investimentoRecomendado - reservaRecomendada);
  }, [baseCalculo, investimentoRecomendado, reservaRecomendada]);

  const efetivarAporte = (valorCustomizado, dataISO) => {
    const valor = parseFloat(valorCustomizado ?? investimentoRecomendado);
    if (valor <= 0) return false;

    const novoAporte = {
      id: gerarId(),
      valor,
      data: dataISO || obterDataHojeISO(),
      descricao: 'Aporte Mensal Efetivado'
    };

    setHistoricoInvestimentos(prev => [novoAporte, ...prev]);
    return true;
  };

  const totalInvestidoAcumulado = useMemo(() => {
    return historicoInvestimentos.reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0);
  }, [historicoInvestimentos]);

  return {
    percentualInvestimento,
    setPercentualInvestimento,
    percentualReserva,
    setPercentualReserva,
    aporteExtra,
    setAporteExtra,
    totalEntradas,
    totalSaidas,
    sobraReal,
    baseCalculo,
    investimentoRecomendado,
    reservaRecomendada,
    livreRecomendado,
    historicoInvestimentos,
    efetivarAporte,
    totalInvestidoAcumulado
  };
}
