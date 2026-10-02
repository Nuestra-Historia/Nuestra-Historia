import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

export interface Config {
  id: number;
  estado: 'preguntando' | 'aceptado' | 'apagado';
  fecha_hablar: string | null;
  fecha_pareja: string | null;
  fecha_aceptado: string | null;
  nombre_a: string | null;
  nombre_b: string | null;
  session_version: number;
  updated_at: string;
}

let supabaseClient: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

export async function getConfig(): Promise<Config> {
  const supabase = getDb();
  const { data, error } = await supabase
    .from('config')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    throw new Error(`Error al obtener configuración: ${error?.message || 'registro no encontrado'}`);
  }

  return data as Config;
}

export async function registrarFallo(ipHash: string): Promise<string | null> {
  const supabase = getDb();
  const { data, error } = await supabase.rpc('login_fail', { p_ip: ipHash });

  if (error) {
    throw new Error(`Error al registrar fallo de login: ${error.message}`);
  }

  return data as string | null;
}

export async function getBloqueo(ipHash: string): Promise<{ bloqueado: boolean; bloqueadoHasta: Date | null }> {
  const supabase = getDb();
  const { data, error } = await supabase
    .from('login_attempts')
    .select('bloqueado_hasta')
    .eq('ip_hash', ipHash)
    .maybeSingle();

  if (error || !data || !data.bloqueado_hasta) {
    return { bloqueado: false, bloqueadoHasta: null };
  }

  const bloqueadoHasta = new Date(data.bloqueado_hasta);
  const bloqueado = bloqueadoHasta.getTime() > Date.now();
  return { bloqueado, bloqueadoHasta };
}

export async function limpiarIntentos(ipHash: string): Promise<void> {
  const supabase = getDb();
  const { error } = await supabase
    .from('login_attempts')
    .delete()
    .eq('ip_hash', ipHash);

  if (error) {
    console.error('Error al limpiar intentos de login:', error);
  }
}

