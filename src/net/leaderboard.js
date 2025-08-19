import { SUPA_URL, SUPA_ANON_KEY } from './supabaseConfig.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabase = createClient(String(SUPA_URL || '').replace(/\/+$/, ''), SUPA_ANON_KEY, {
  auth: { persistSession: false }
});

function raise(ctx, error) {
  console.error(`[leaderboard] ${ctx} error`, {
    message: error?.message, code: error?.code, details: error?.details, hint: error?.hint
  });
  throw error;
}

export async function submitScore(name, score, empresa = '') {
  const safeName    = String(name ?? 'Anónimo').trim().slice(0, 20);
  const safeEmpresa = String(empresa ?? '').trim().slice(0, 20);
  const safeScore   = Math.max(0, Math.floor(Number(score) || 0));

  const { data, error } = await supabase.rpc('submit_best_score', {
    p_name: safeName,
    p_empresa: safeEmpresa,
    p_score: safeScore
  });

  if (error) raise('submit_best_score', error);
  // Devuelve lo que usa GameOverScene
  return { id: data.id, score: data.score, created_at: data.created_at };
}

export async function fetchTopScores(limit = 10) {
  const { data, error } = await supabase
    .from('scores')
    .select('name, score, created_at, empresa')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) raise('fetchTopScores', error);
  return data ?? [];
}

export async function fetchRankAndTotal(score, createdAtISO) {
  const or = `score.gt.${score},and(score.eq.${score},created_at.lt.${createdAtISO})`;
  const better = await supabase.from('scores').select('id', { count: 'exact', head: true }).or(or);
  if (better.error) raise('fetchRankAndTotal/better', better.error);
  const total  = await supabase.from('scores').select('id', { count: 'exact', head: true });
  if (total.error) raise('fetchRankAndTotal/total', total.error);
  return { rank: (better.count ?? 0) + 1, total: total.count ?? ((better.count ?? 0) + 1) };
}
export async function fetchScoresPage(page = 1, pageSize = 15) {
  const p = Math.max(1, Math.floor(page));
  const size = Math.max(1, Math.floor(pageSize));
  const from = (p - 1) * size;
  const to   = from + size - 1;

  const { data, count, error } = await supabase
    .from('scores')
    .select('name, score, created_at, empresa', { count: 'exact' })
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .range(from, to);

  if (error) raise('fetchScoresPage', error);
  return { rows: data ?? [], total: count ?? 0 };
}




