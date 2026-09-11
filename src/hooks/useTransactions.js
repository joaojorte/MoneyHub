import { useState, useEffect, useCallback, useRef } from 'react';
import { STORAGE_KEYS } from '../utils/constants';
import { syncService, authService } from '../services/supabaseClient';
import { compactarPacoteDados, descompactarPacoteDados } from '../utils/dataOptimizer';

export function useTransactions() {
  const [entradas, setEntradas] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.LOCAL_DATA);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        const descompactado = descompactarPacoteDados(parsed);
        return descompactado.entradas || [];
      }
    } catch (e) {}
    return [];
  });

  const [saidas, setSaidas] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEYS.LOCAL_DATA);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        const descompactado = descompactarPacoteDados(parsed);
        return descompactado.saidas || [];
      }
    } catch (e) {}
    return [];
  });

  const [usuario, setUsuario] = useState(null);
  const [statusSincronizacao, setStatusSincronizacao] = useState('pronto'); // 'pronto' | 'salvando' | 'salvo'
  const inicializadoRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // Carrega usuário atual e sincroniza dados da nuvem com proteção contra race conditions
  useEffect(() => {
    let cancelado = false;

    authService.getUsuarioAtual().then(user => {
      if (cancelado) return;
      setUsuario(user);

      if (user) {
        syncService.carregarDados(user.id).then(dadosNuvem => {
          if (cancelado) return;
          if (dadosNuvem) {
            if (dadosNuvem.entradas && Array.isArray(dadosNuvem.entradas)) {
              setEntradas(dadosNuvem.entradas);
            }
            if (dadosNuvem.saidas && Array.isArray(dadosNuvem.saidas)) {
              setSaidas(dadosNuvem.saidas);
            }
          }
          inicializadoRef.current = true;
        }).catch(() => {
          inicializadoRef.current = true;
        });
      } else {
        inicializadoRef.current = true;
      }
    });

    return () => {
      cancelado = true;
    };
  }, []);

  // Escuta alterações em tempo real via WebSocket (Realtime Supabase)
  useEffect(() => {
    if (!usuario) return;

    const cleanup = syncService.escutarMudancas(usuario.id, (novosDados) => {
      if (novosDados) {
        if (novosDados.entradas) setEntradas(novosDados.entradas);
        if (novosDados.saidas) setSaidas(novosDados.saidas);
      }
    });

    return cleanup;
  }, [usuario]);

  // Persistência local (imediata e compactada) e Sincronização em Nuvem (Debounced a 500ms)
  useEffect(() => {
    // Salva localmente em formato otimizado
    const payloadCompacto = compactarPacoteDados({ entradas, saidas });
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_DATA, JSON.stringify(payloadCompacto));
    } catch (e) {}

    // Só dispara gravação em nuvem após carregamento inicial concluído
    if (!inicializadoRef.current || !usuario) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setStatusSincronizacao('salvando');

    // Debounce de 500ms para agregar múltiplos inputs rápidos em uma ÚNICA escrita no banco
    debounceTimerRef.current = setTimeout(async () => {
      const sucesso = await syncService.salvarDados(usuario.id, { entradas, saidas });
      setStatusSincronizacao(sucesso ? 'salvo' : 'erro');
      setTimeout(() => setStatusSincronizacao('pronto'), 2000);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
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
    usuario,
    statusSincronizacao,
    metricasConsumo: syncService.estatisticasConsumo
  };
}
