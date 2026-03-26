export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper';
  base_price: number;
  status: 'unsold' | 'sold';
  sold_to: string | null;
  sold_price: number | null;
  created_at: string;
}

export interface Team {
  id: string;
  team_name: string;
  owner_name: string;
  icon_player_name: string;
  icon_player_role: string;
  email: string;
  budget: number;
  total_players: number;
  batsmen: number;
  bowlers: number;
  all_rounders: number;
  wicket_keepers: number;
  created_at: string;
}

export interface AuctionLog {
  id: string;
  player_id: string;
  team_id: string;
  action: 'sold' | 'undo';
  price: number;
  created_at: string;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'owner';
  teamId?: string;
  teamName?: string;
}