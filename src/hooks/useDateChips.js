import { useState, useMemo } from 'react';
import { obterDataHojeISO, obterDataOntemISO } from '../utils/formatters';

export function useDateChips() {
  const [opcao, setOpcao] = useState('hoje'); // 'hoje' | 'ontem' | 'outro'
  const [dataManual, setDataManual] = useState('');

  const dataHoje = useMemo(() => obterDataHojeISO(), []);
  const dataOntem = useMemo(() => obterDataOntemISO(), []);

  const dataEfetiva = useMemo(() => {
    if (opcao === 'hoje') return dataHoje;
    if (opcao === 'ontem') return dataOntem;
    return dataManual || dataHoje;
  }, [opcao, dataManual, dataHoje, dataOntem]);

  const resetar = () => {
    setOpcao('hoje');
    setDataManual('');
  };

  return {
    opcao,
    setOpcao,
    dataManual,
    setDataManual,
    dataEfetiva,
    isManualAtivo: opcao === 'outro',
    resetar
  };
}
