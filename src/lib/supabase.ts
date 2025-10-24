// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database
export interface Tournament {
  id: string;
  created_at: string;
  name: string;
  status: 'setup' | 'in_progress' | 'completed';
  current_round: number;
  total_rounds: number | null;
  champion: string | null;
}

export interface Participant {
  id: string;
  tournament_id: string;
  name: string;
  seed_position: number;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round_index: number;
  match_index: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  completed: boolean;
  is_bye: boolean;
  created_at: string;
}