import { useState, useEffect, useCallback } from 'react';

const CARTOES_KEY = 'moneyhub_cartoes_cadastrados';
const CARTAO_ATIVO_KEY = 'moneyhub_cartao_ativo_uid';
export const EVENTO_CARTOES_UPDATE = 'moneyhub_cartoes_updated';

export function notificarAtualizacaoCartoes() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTO_CARTOES_UPDATE));
  }
}

export function useCreditCards() {
  const lerCartoesStorage = () => {
    try {
      const salvo = localStorage.getItem(CARTOES_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => c.uid !== 'default-1');
        }
      }
    } catch (e) {}
    return [];
  };

  const lerCartaoAtivoStorage = () => {
    try {
      return localStorage.getItem(CARTAO_ATIVO_KEY) || '';
    } catch (e) {}
    return '';
  };

  const [cartoes, setCartoes] = useState(lerCartoesStorage);
  const [cartaoAtivoUid, setCartaoAtivoUid] = useState(lerCartaoAtivoStorage);

  const recarregar = useCallback(() => {
    const novos = lerCartoesStorage();
    const ativo = lerCartaoAtivoStorage();
    setCartoes(novos);
    setCartaoAtivoUid(ativo || (novos.length > 0 ? novos[0].uid : ''));
  }, []);

  useEffect(() => {
    const handleUpdate = () => recarregar();
    window.addEventListener(EVENTO_CARTOES_UPDATE, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENTO_CARTOES_UPDATE, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [recarregar]);

  const salvarCartoes = useCallback((novaLista) => {
    try {
      localStorage.setItem(CARTOES_KEY, JSON.stringify(novaLista));
      setCartoes(novaLista);
      notificarAtualizacaoCartoes();
    } catch (e) {}
  }, []);

  const definirCartaoAtivo = useCallback((uid) => {
    try {
      localStorage.setItem(CARTAO_ATIVO_KEY, uid);
      setCartaoAtivoUid(uid);
      notificarAtualizacaoCartoes();
    } catch (e) {}
  }, []);

  const cartaoAtivo = cartoes.find(c => c.uid === cartaoAtivoUid) || cartoes[0] || null;

  return {
    cartoes,
    cartaoAtivoUid,
    cartaoAtivo,
    salvarCartoes,
    definirCartaoAtivo,
    temCartoesCadastrados: cartoes.length > 0,
    recarregar
  };
}
