import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

export function useCreditCardDue(defaultDay = 10) {
  const [diaVencimento, setDiaVencimento] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.CARTAO_DIA_VENCIMENTO);
      if (salvo !== null && salvo.trim() !== '') {
        const num = parseInt(salvo, 10);
        if (!isNaN(num) && num >= 1 && num <= 31) return num;
      }
    } catch (e) {}
    return null; // Sem dia salvo (primeiro uso)
  });

  const [modoEdicao, setModoEdicao] = useState(false);
  const [inputDia, setInputDia] = useState('');

  useEffect(() => {
    if (diaVencimento) {
      setInputDia(String(diaVencimento));
    }
  }, [diaVencimento]);

  const salvarDia = (dia) => {
    const num = Math.max(1, Math.min(31, parseInt(dia, 10) || defaultDay));
    setDiaVencimento(num);
    setModoEdicao(false);
    try {
      localStorage.setItem(STORAGE_KEYS.CARTAO_DIA_VENCIMENTO, String(num));
    } catch (e) {}
    return num;
  };

  return {
    diaVencimento: diaVencimento || defaultDay,
    hasDiaMemorizado: diaVencimento !== null,
    modoEdicao: modoEdicao || diaVencimento === null,
    abrirEdicao: () => setModoEdicao(true),
    fecharEdicao: () => setModoEdicao(false),
    inputDia,
    setInputDia,
    salvarDia
  };
}
