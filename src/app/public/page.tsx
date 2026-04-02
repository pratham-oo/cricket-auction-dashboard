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

  // WhatsApp Group Links - Update as you get them
  const whatsappLinks: { [key: string]: string } = {
    'HE Fighters': 'https://chat.whatsapp.com/JEdMUmupKd30sLdeGRWpSM?mode=gi_t',
    'Gully Master': 'https://chat.whatsapp.com/H6NEOnpKuNr73CsWTo6l4p?mode=gi_t',
    // Add more links as you get them
    '45 Blasters': ' https://chat.whatsapp.com/EMEHhKZM1kpJKrtalW13EH?mode=gi_t',
    'Venom Knight Riders': ' https://chat.whatsapp.com/KbLrt3tN1Hq9cOeog0TDfc?mode=gi_t',
    "SKILLER'S": ' https://chat.whatsapp.com/K2P97hDFjKXHU0GdmCG0LA?mode=gi_t',
    'Skull Crusher': 'https://chat.whatsapp.com/FKzOrw6FetX6H0BGq4vgUo?mode=gi_t',
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
            EPL Auction 2026 - Final Playing XI
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Click on the team to view which team you are in.
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
                  {/* Playing 11 Summary */}
                  <div className="mb-3 p-2 bg-gray-800 rounded-lg text-center">
                    <p className="text-xs text-gray-400">Playing 11</p>
                    <p className="text-xl font-bold text-white">{totalPlayers}/11 Players</p>
                  </div>

                  {/* Icon Player */}
                  <div className="mb-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 text-xs">⭐ Icon</span>
                      <span className="text-white font-semibold text-sm">{team.icon_player_name}</span>
                    </div>
                  </div>

                  {/* Owner/Captain */}
                  <div className="mb-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 text-xs">👑 Captain</span>
                      <span className="text-white font-semibold text-sm">{team.owner_name}</span>
                    </div>
                  </div>

                  {/* Auction Players Count */}
                  <div className="mb-2 p-2 bg-purple-500/10 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400 text-xs">🎯 Auction Players</span>
                      <span className="text-white font-semibold text-sm">{team.players.length}/9</span>
                    </div>
                  </div>

                  {/* Budget Info */}
                  <div className="mb-3 p-2 bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Total Spent:</span>
                      <span className="text-yellow-400 font-bold text-sm">{formatCurrency(team.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400 text-xs">Remaining:</span>
                      <span className={`font-bold text-sm ${team.remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
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
                    <div className="text-center text-gray-500 text-xs py-2 bg-gray-800 rounded-lg">
                      WhatsApp link coming soon
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Team Details Modal - Complete Playing 11 */}
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
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedTeamData.team_name}</h2>
                  <p className="text-gray-400 text-sm">Complete Playing 11</p>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Team Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-400">Total Squad</p>
                    <p className="text-2xl font-bold text-white">{selectedTeamData.players.length + 2}/11</p>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-400">Total Spent</p>
                    <p className="text-xl font-bold text-yellow-400">{formatCurrency(selectedTeamData.totalSpent)}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-400">Remaining Budget</p>
                    <p className={`text-xl font-bold ${selectedTeamData.remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(selectedTeamData.remainingBudget)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-400">Auction Players</p>
                    <p className="text-2xl font-bold text-green-400">{selectedTeamData.players.length}/9</p>
                  </div>
                </div>

                {/* Complete Playing 11 List */}
                <h3 className="text-lg font-semibold text-white mb-4">🏏 COMPLETE PLAYING 11</h3>
                <div className="space-y-2 mb-6">
                  {/* Icon Player */}
                  <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-lg border-l-4 border-yellow-500">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-yellow-400 text-xs font-semibold">⭐ ICON PLAYER</p>
                        <p className="text-white font-bold text-lg">{selectedTeamData.icon_player_name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(selectedTeamData.icon_player_role)}`}>
                          {selectedTeamData.icon_player_role}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Pre-assigned</p>
                    </div>
                  </div>

                  {/* Owner/Captain */}
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-transparent rounded-lg border-l-4 border-blue-500">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-blue-400 text-xs font-semibold">👑 TEAM CAPTAIN</p>
                        <p className="text-white font-bold text-lg">{selectedTeamData.owner_name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-400">
                          All-rounder
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">Team Owner</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-700 my-3"></div>

                  {/* Auction Players */}
                  {selectedTeamData.players.map((player, index) => (
                    <div key={player.id} className="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm w-6">#{index + 1}</span>
                        <div>
                          <p className="font-semibold text-white">{player.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(player.role)}`}>
                            {player.role}
                          </span>
                        </div>
                      </div>
                      <p className="text-yellow-400 font-bold">{formatCurrency(player.sold_price || 0)}</p>
                    </div>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: 9 - selectedTeamData.players.length }).map((_, index) => (
                    <div key={`empty-${index}`} className="p-3 bg-gray-800/30 rounded-lg border border-dashed border-gray-600">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 text-sm w-6">-</span>
                          <div>
                            <p className="text-gray-500">Slot Available</p>
                            <p className="text-xs text-gray-600">To be filled in auction</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Budget Breakdown */}
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <h3 className="text-md font-semibold text-white mb-3">💰 Budget Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Initial Budget:</span>
                      <span className="text-white font-semibold">{formatCurrency(2500)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Spent on Auction:</span>
                      <span className="text-yellow-400 font-semibold">{formatCurrency(selectedTeamData.totalSpent)}</span>
                    </div>
                    <div className="border-t border-gray-700 my-1"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Remaining Purse:</span>
                      <span className={`font-bold text-lg ${selectedTeamData.remainingBudget < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {formatCurrency(selectedTeamData.remainingBudget)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Link */}
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
          <p>Cricket Auction 2024 - Final Playing XI</p>
          <p className="mt-1">Developed by Pratham Shinde</p>
        </div>
      </footer>
    </div>
  );
}