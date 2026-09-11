import { createClient } from '@supabase/supabase-js';
import { 
  compactarPacoteDados, 
  descompactarPacoteDados, 
  calcularTamanhoBytes 
} from '../utils/dataOptimizer';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sywvuaugyuxjhvpgmvxz.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kIPPe6HSm1gXNE7CJXZ9Ug_KbCgbg8J';
export const TABELA_NUVEM = 'moneyhub_nuvem';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const authService = {
  async getUsuarioAtual() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  },

  async login(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async cadastro(email, password) {
    return await supabase.auth.signUp({ email, password });
  },

  async logout() {
    return await supabase.auth.signOut();
  }
};

let ultimoHashSalvo = '';

export const syncService = {
  ultimoHash: '',
  estatisticasConsumo: {
    bytesUltimoPayload: 0,
    bytesEconomizadosEstimados: 0,
    totalEnvios: 0
  },

  async carregarDados(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from(TABELA_NUVEM)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('MoneyHub (Supabase): Erro ao carregar dados:', error.message);
      return null;
    }

    if (!data) return null;
    const dadosBrutos = data.dados || data;
    const dadosDescompactados = descompactarPacoteDados(dadosBrutos);

    // Registra hash inicial para evitar envio imediato duplicado
    ultimoHashSalvo = JSON.stringify(compactarPacoteDados(dadosDescompactados));

    return dadosDescompactados;
  },

  async salvarDados(userId, dadosCompletos) {
    if (!userId || !dadosCompletos) return false;

    // 1. Otimização e compactação de payload
    const dadosOtimizados = compactarPacoteDados(dadosCompletos);
    const hashAtual = JSON.stringify(dadosOtimizados);

    // 2. Deduplicação inteligente: se os dados não mudaram, não consome nada do banco!
    if (hashAtual === ultimoHashSalvo) {
      return true;
    }

    const agoraISO = new Date().toISOString();
    const payload = {
      user_id: userId,
      dados: dadosOtimizados,
      atualizado_em: agoraISO,
      updated_at: agoraISO
    };

    // 3. Métricas de consumo
    const tamanhoOtimizado = calcularTamanhoBytes(payload);
    const tamanhoOriginalEstimado = calcularTamanhoBytes(dadosCompletos);
    this.estatisticasConsumo = {
      bytesUltimoPayload: tamanhoOtimizado,
      bytesEconomizadosEstimados: Math.max(0, tamanhoOriginalEstimado - tamanhoOtimizado),
      totalEnvios: this.estatisticasConsumo.totalEnvios + 1
    };

    const { error } = await supabase
      .from(TABELA_NUVEM)
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('MoneyHub (Supabase): Erro ao salvar dados:', error.message);
      return false;
    }

    ultimoHashSalvo = hashAtual;
    return true;
  },

  escutarMudancas(userId, callback) {
    if (!userId) return () => {};
    const canal = supabase
      .channel(`sync_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: TABELA_NUVEM,
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && payload.new.dados) {
            const restaurados = descompactarPacoteDados(payload.new.dados);
            ultimoHashSalvo = JSON.stringify(compactarPacoteDados(restaurados));
            callback(restaurados);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }
};
