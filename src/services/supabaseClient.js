import { createClient } from '@supabase/supabase-js';

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

export const syncService = {
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
    return data ? (data.dados || data) : null;
  },

  async salvarDados(userId, dadosCompletos) {
    if (!userId) return false;
    const payload = {
      user_id: userId,
      dados: dadosCompletos,
      atualizado_em: new Date().toISOString()
    };

    const { error } = await supabase
      .from(TABELA_NUVEM)
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('MoneyHub (Supabase): Erro ao salvar dados:', error.message);
      return false;
    }
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
            callback(payload.new.dados);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }
};
