import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Player, Team, AuctionLog } from '@/types';
import toast from 'react-hot-toast';

// Helper function for formatting currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const useAuction = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [logs, setLogs] = useState<AuctionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [currentBid, setCurrentBid] = useState(25);
  const [auctionRound, setAuctionRound] = useState(1);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      console.log('Fetching initial data...');
      
      const [playersRes, teamsRes, logsRes] = await Promise.all([
        supabase.from('players').select('*').order('name'),
        supabase.from('teams').select('*').order('team_name'),
        supabase.from('auction_logs').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (playersRes.error) throw playersRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (logsRes.error) throw logsRes.error;

      console.log('Fetched players:', playersRes.data.length);
      console.log('Fetched teams:', teamsRes.data.length);
      console.log('Fetched logs:', logsRes.data.length);

      setPlayers(playersRes.data);
      setTeams(teamsRes.data);
      setLogs(logsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load auction data');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchInitialData();

    // Subscribe to players table
    const playersChannel = supabase
      .channel('players-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
          console.log('🔄 Players real-time update:', payload);
          if (payload.eventType === 'UPDATE') {
            setPlayers(prev => 
              prev.map(p => p.id === payload.new.id ? payload.new as Player : p)
            );
          }
          if (payload.eventType === 'INSERT') {
            setPlayers(prev => [...prev, payload.new as Player]);
          }
        }
      )
      .subscribe((status) => {
        console.log('Players channel status:', status);
      });

    // Subscribe to teams table
    const teamsChannel = supabase
      .channel('teams-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams' },
        (payload) => {
          console.log('🔄 Teams real-time update:', payload);
          if (payload.eventType === 'UPDATE') {
            setTeams(prev => 
              prev.map(t => t.id === payload.new.id ? payload.new as Team : t)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Teams channel status:', status);
      });

    // Subscribe to auction_logs table
    const logsChannel = supabase
      .channel('logs-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_logs' },
        (payload) => {
          console.log('🔄 Logs real-time update:', payload);
          if (payload.eventType === 'INSERT') {
            setLogs(prev => [payload.new as AuctionLog, ...prev]);
          }
          if (payload.eventType === 'UPDATE') {
            setLogs(prev => 
              prev.map(l => l.id === payload.new.id ? payload.new as AuctionLog : l)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Logs channel status:', status);
      });

    return () => {
      console.log('Cleaning up subscriptions...');
      playersChannel.unsubscribe();
      teamsChannel.unsubscribe();
      logsChannel.unsubscribe();
    };
  }, []);

  const sellPlayer = async (playerId: string, teamId: string, price: number) => {
    try {
      console.log('💰 Selling player:', playerId, 'to team:', teamId, 'for:', price);
      
      const team = teams.find(t => t.id === teamId);
      const player = players.find(p => p.id === playerId);

      if (!team || !player) {
        throw new Error('Team or player not found');
      }

      // Check if player is already sold
      if (player.status === 'sold') {
        toast.error(`${player.name} has already been sold!`);
        return false;
      }

      // Check player limit
      const auctionPlayersCount = players.filter(p => p.sold_to === teamId).length;
      if (auctionPlayersCount >= 9) {
        toast.error(`${team.team_name} already has maximum auction players (9)!`);
        return false;
      }

      // Check role limits
      let roleKey: keyof Team;
      switch (player.role) {
        case 'Batsman':
          roleKey = 'batsmen';
          break;
        case 'Bowler':
          roleKey = 'bowlers';
          break;
        case 'All-rounder':
          roleKey = 'all_rounders';
          break;
        case 'Wicket-keeper':
          roleKey = 'wicket_keepers';
          break;
        default:
          roleKey = 'all_rounders';
      }
      
      const currentRoleCount = team[roleKey] as number;
      
      if (currentRoleCount >= 7) {
        toast.error(`Maximum ${player.role}s (7) reached for ${team.team_name}!`);
        return false;
      }

      // Update player with atomic condition
      const { data: updateResult, error: playerError } = await supabase
        .from('players')
        .update({
          status: 'sold',
          sold_to: teamId,
          sold_price: price,
        })
        .eq('id', playerId)
        .eq('status', 'unsold')
        .select();

      if (playerError) {
        console.error('Player update error:', playerError);
        throw playerError;
      }

      if (!updateResult || updateResult.length === 0) {
        toast.error(`${player.name} has already been sold!`);
        return false;
      }

      console.log('✅ Player updated successfully');

      // Update team stats
      const updateData: any = {
        budget: team.budget - price,
        total_players: team.total_players + 1,
      };
      updateData[roleKey] = currentRoleCount + 1;

      const { error: teamError } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId);

      if (teamError) {
        console.error('Team update error:', teamError);
        // Revert player
        await supabase
          .from('players')
          .update({ status: 'unsold', sold_to: null, sold_price: null })
          .eq('id', playerId);
        throw teamError;
      }

      console.log('✅ Team updated successfully');

      // Create auction log
      const { error: logError } = await supabase
        .from('auction_logs')
        .insert({
          player_id: playerId,
          team_id: teamId,
          action: 'sold',
          price: price,
        });

      if (logError) {
        console.error('Log insert error:', logError);
        toast.error('Sale completed but log entry failed');
      } else {
        console.log('✅ Auction log created');
      }

      // Show success message
      const newBudget = team.budget - price;
      if (newBudget < 0) {
        toast.error(`${team.team_name} is now OVER BUDGET by ${formatCurrency(Math.abs(newBudget))}!`, {
          duration: 5000,
          icon: '⚠️',
        });
      } else if (newBudget < 100) {
        toast.success(`${player.name} sold to ${team.team_name} for ${price} points! (Only ${formatCurrency(newBudget)} left)`, {
          duration: 4000,
        });
      } else {
        toast.success(`${player.name} sold to ${team.team_name} for ${price} points!`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error selling player:', error);
      toast.error('Failed to complete sale');
      return false;
    }
  };

  const undoSale = async (logId: string) => {
    try {
      console.log('↩️ Undoing sale with logId:', logId);
      
      const { data: log, error: logError } = await supabase
        .from('auction_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (logError) {
        console.error('Error fetching log:', logError);
        toast.error('Failed to find sale record');
        return false;
      }
      
      if (log.action !== 'sold') {
        toast.error('This sale has already been undone');
        return false;
      }

      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', log.player_id)
        .single();

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', log.team_id)
        .single();

      if (playerError || teamError) {
        console.error('Error fetching data:', { playerError, teamError });
        toast.error('Player or team not found');
        return false;
      }

      let roleKey: keyof Team;
      switch (player.role) {
        case 'Batsman': roleKey = 'batsmen'; break;
        case 'Bowler': roleKey = 'bowlers'; break;
        case 'All-rounder': roleKey = 'all_rounders'; break;
        case 'Wicket-keeper': roleKey = 'wicket_keepers'; break;
        default: roleKey = 'all_rounders';
      }

      // Reverse player
      await supabase
        .from('players')
        .update({ status: 'unsold', sold_to: null, sold_price: null })
        .eq('id', log.player_id);

      // Reverse team
      const currentRoleCount = team[roleKey] as number;
      await supabase
        .from('teams')
        .update({
          budget: team.budget + log.price,
          total_players: team.total_players - 1,
          [roleKey]: currentRoleCount - 1,
        })
        .eq('id', log.team_id);

      // Update log
      await supabase
        .from('auction_logs')
        .update({ action: 'undo' })
        .eq('id', logId);

      toast.success('Sale undone successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error undoing sale:', error);
      toast.error('Failed to undo sale');
      return false;
    }
  };

  const getTeamById = (teamId: string) => {
    return teams.find(t => t.id === teamId);
  };

  const getUnsoldPlayers = () => {
    return players.filter(p => p.status === 'unsold');
  };

  const getSoldPlayers = () => {
    return players.filter(p => p.status === 'sold');
  };

  const getTeamPlayers = (teamId: string) => {
    return players.filter(p => p.sold_to === teamId);
  };

  return {
    players,
    teams,
    logs,
    loading,
    selectedPlayer,
    setSelectedPlayer,
    currentBid,
    setCurrentBid,
    auctionRound,
    setAuctionRound,
    sellPlayer,
    undoSale,
    getTeamById,
    getUnsoldPlayers,
    getSoldPlayers,
    getTeamPlayers,
  };
};