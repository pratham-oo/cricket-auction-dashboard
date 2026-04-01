'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Player, Team } from '@/types';
import { formatCurrency, getRoleColor, getRoleIcon } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface TeamWithPlayers extends Team {
  players: Player[];
  totalSpent: number;
  remainingBudget: number;
}

export default function PublicDashboard() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // WhatsApp Group Links
  const whatsappLinks: { [key: string]: string } = {
    'HE Fighters': 'https://chat.whatsapp.com/JEdMUmupKd30sLdeGRWpSM?mode=gi_t',
    'Gully Master': 'https://chat.whatsapp.com/H6NEOnpKuNr73CsWTo6l4p?mode=gi_t',
    // Add more links as you get them
    // '45 Blasters': 'your-whatsapp-link',
    // 'Venom Knight Riders': 'your-whatsapp-link',
    // 'SKILLER\'S': 'your-whatsapp-link',
    // 'Skull Crusher': 'your-whatsapp-link',
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');

      if (teamsError) throw teamsError;

      // Fetch all sold players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('status', 'sold')
        .order('name');

      if (playersError) throw playersError;

      setPlayers(playersData || []);

      // Calculate team stats
      const teamsWithPlayers: TeamWithPlayers[] = (teamsData || []).map(team => {
        const teamPlayers = (playersData || []).filter(p => p.sold_to === team.id);
        const totalSpent = teamPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
        
        return {
          ...team,
          players: teamPlayers,
          totalSpent,
          remainingBudget: team.budget,
        };
      });

      setTeams(teamsWithPlayers);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading auction results...</div>
      </div>
    );
  }

  const selectedTeamData = teams.find(t => t.team_name === selectedTeam);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Cricket Auction 2024 Results
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Final squad details after the auction
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {teams.map((team) => {
            const totalPlayers = team.players.length + 2; // +2 for icon and owner
            const whatsappLink = whatsappLinks[team.team_name];
            
            return (
              <Card 
                key={team.id} 
                className="cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => setSelectedTeam(team.team_name)}
              >
                <CardHeader className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                  <CardTitle className="text-xl font-bold text-white text-center">
                    {team.team_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {/* Icon Player */}
                  <div className="mb-3 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 text-sm">⭐ Icon Player</span>
                      <span className="text-white font-semibold">{team.icon_player_name}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400 text-sm">Role:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(team.icon_player_role)}`}>
                        {team.icon_player_role}
                      </span>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="mb-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 text-sm">👑 Owner/Captain</span>
                      <span className="text-white font-semibold">{team.owner_name}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-center p-2 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-400">Total Players</p>
                      <p className="text-xl font-bold text-white">{totalPlayers}/11</p>
                    </div>
                    <div className="text-center p-2 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-400">Auction Players</p>
                      <p className="text-xl font-bold text-green-400">{team.players.length}/9</p>
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="p-2 bg-gray-800 rounded-lg mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Total Spent:</span>
                      <span className="text-yellow-400 font-bold">{formatCurrency(team.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400 text-sm">Remaining:</span>
                      <span className={`font-bold ${team.remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(team.remainingBudget)}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Link */}
                  {whatsappLink ? (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      📱 Join WhatsApp Group
                    </a>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-2 bg-gray-800 rounded-lg">
                      WhatsApp link coming soon
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Team Details Modal */}
        {selectedTeamData && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedTeam(null)}
          >
            <div 
              className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">{selectedTeamData.team_name}</h2>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Icon Player & Owner Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <h3 className="text-yellow-400 font-semibold mb-2">⭐ Icon Player</h3>
                    <p className="text-white text-lg">{selectedTeamData.icon_player_name}</p>
                    <p className="text-gray-400 text-sm">Role: {selectedTeamData.icon_player_role}</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <h3 className="text-blue-400 font-semibold mb-2">👑 Team Owner/Captain</h3>
                    <p className="text-white text-lg">{selectedTeamData.owner_name}</p>
                    <p className="text-gray-400 text-sm">All-rounder</p>
                  </div>
                </div>

                {/* Auction Players List */}
                <h3 className="text-xl font-semibold text-white mb-4">Auction Players ({selectedTeamData.players.length}/9)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {selectedTeamData.players.map((player) => (
                    <div key={player.id} className="p-3 bg-gray-800 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(player.role)}`}>
                          {player.role}
                        </span>
                      </div>
                      <p className="text-yellow-400 font-bold">{formatCurrency(player.sold_price || 0)}</p>
                    </div>
                  ))}
                  {selectedTeamData.players.length === 0 && (
                    <p className="text-gray-400 col-span-2 text-center py-4">No auction players yet</p>
                  )}
                </div>

                {/* Budget Summary */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Budget Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Initial Budget</p>
                      <p className="text-white font-bold">{formatCurrency(2500)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Spent</p>
                      <p className="text-yellow-400 font-bold">{formatCurrency(selectedTeamData.totalSpent)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Remaining</p>
                      <p className={`font-bold ${selectedTeamData.remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(selectedTeamData.remainingBudget)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Squad</p>
                      <p className="text-white font-bold">{selectedTeamData.players.length + 2}/11</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Link in Modal */}
                {whatsappLinks[selectedTeamData.team_name] && (
                  <a
                    href={whatsappLinks[selectedTeamData.team_name]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors font-semibold"
                  >
                    📱 Join {selectedTeamData.team_name} WhatsApp Group
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Cricket Auction 2024 - Final Results</p>
          <p className="mt-1">Developed by Pratham Shinde</p>
        </div>
      </footer>
    </div>
  );
}