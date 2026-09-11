import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { syncService, authService } from '../services/supabaseClient';

export function useTransactions() {
  const [entradas, setEntradas] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.LOCAL_DATA);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        return parsed.entradas || [];
      }
    } catch (e) {}
    return [];
  });

  const [saidas, setSaidas] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.LOCAL_DATA);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        return parsed.saidas || [];
      }
    } catch (e) {}
    return [];
  });

  const [usuario, setUsuario] = useState(null);

  // Carrega usuário atual ao inicializar
  useEffect(() => {
    authService.getUsuarioAtual().then(user => {
      setUsuario(user);
      if (user) {
        syncService.carregarDados(user.id).then(dados => {
          if (dados) {
            if (dados.entradas) setEntradas(dados.entradas);
            if (dados.saidas) setSaidas(dados.saidas);
          }
        });
      }
    });
  }, []);

  // Persistência local e sincronização remota
  useEffect(() => {
    const payload = { entradas, saidas };
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_DATA, JSON.stringify(payload));
    } catch (e) {}

    if (usuario) {
      syncService.salvarDados(usuario.id, payload);
    }
  }, [entradas, saidas, usuario]);

  const addEntrada = useCallback((item) => {
    setEntradas(prev => [item, ...prev]);
  }, []);

  const removeEntrada = useCallback((id) => {
    setEntradas(prev => prev.filter(item => item.id !== id));
  }, []);

  const addSaida = useCallback((novoOuLista) => {
    if (Array.isArray(novoOuLista)) {
      setSaidas(prev => [...novoOuLista, ...prev]);
    } else {
      setSaidas(prev => [novoOuLista, ...prev]);
    }
  }, []);

  const removeSaida = useCallback((id) => {
    setSaidas(prev => {
      // Se for item projetado de assinatura, remove a assinatura base
      if (typeof id === 'string' && id.startsWith('proj_')) {
        const idOrigem = id.split('_')[1];
        return prev.filter(item => item.id !== idOrigem);
      }
      return prev.filter(item => item.id !== id);
    });
  }, []);

  return {
    entradas,
    saidas,
    addEntrada,
    removeEntrada,
    addSaida,
    removeSaida,
    usuario
  };
}
