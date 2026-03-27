'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuction } from '@/hooks/useAuction';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, getRoleColor, getRoleIcon } from '@/lib/utils';
import { exportOwnerTeam, exportOwnerBudget } from '@/lib/exportUtils';

export default function OwnerPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const { user, loading: authLoading } = useAuth();
  const {
    players,
    teams,
    logs,
    loading,
    getTeamById,
    getTeamPlayers,
  } = useAuction();

  const [activeTab, setActiveTab] = useState<'squad' | 'auction'>('squad');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const currentTeam = getTeamById(teamId);
  const teamPlayers = getTeamPlayers(teamId);
  
  // Get unsold players for auction view
  const unsoldPlayers = players.filter(p => p.status === 'unsold');

  // Protect owner route - redirect if not the correct owner
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'owner' || user.teamId !== teamId)) {
      router.push('/login');
    }
  }, [user, authLoading, teamId, router]);

  // Calculate team stats
  const getRoleCount = (role: string) => {
    return teamPlayers.filter(p => p.role === role).length;
  };

  // Need 9 players from auction (total squad 11, already have 2 - icon + owner)
  const getRemainingPlayers = () => {
    return 9 - teamPlayers.length;
  };

  // FIXED: Use the team's budget directly from the database
  const getRemainingBudget = () => {
    if (!currentTeam) return 0;
    // The budget in currentTeam is already updated by the admin
    return currentTeam.budget;
  };

  // Total squad size (Icon + Owner + Auction players)
  const getTotalSquadSize = () => {
    return 2 + teamPlayers.length;
  };

  // Export handlers
  const handleExport = (type: 'squad' | 'budget') => {
    if (!currentTeam) return;
    
    if (type === 'squad') {
      exportOwnerTeam(currentTeam, teamPlayers, logs);
    } else if (type === 'budget') {
      exportOwnerBudget(currentTeam, teamPlayers);
    }
    setShowExportMenu(false);
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If not authorized, don't render
  if (!user || user.role !== 'owner' || user.teamId !== teamId) {
    return null;
  }

  const remainingBudget = getRemainingBudget();
  const isOverBudget = remainingBudget < 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header - Mobile Optimized with Export Button */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-base md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                {currentTeam?.team_name}
              </h1>
              <p className="text-gray-400 text-xs md:text-sm">Welcome, {currentTeam?.owner_name}</p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="text-right">
                <div className="text-xs text-gray-400">Available Budget</div>
                <div className={`text-lg md:text-2xl font-bold ${isOverBudget ? 'text-red-500' : remainingBudget < 100 ? 'text-orange-400' : 'text-green-400'}`}>
                  {formatCurrency(remainingBudget)}
                </div>
                {isOverBudget && (
                  <p className="text-xs text-red-400">Over by {formatCurrency(Math.abs(remainingBudget))}</p>
                )}
              </div>
              
              {/* Export Button with Dropdown */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  📊 Export
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                    <button
                      onClick={() => handleExport('squad')}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      📋 Export My Squad
                    </button>
                    <button
                      onClick={() => handleExport('budget')}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      💰 Export Budget Details
                    </button>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('auction_user');
                  window.location.href = '/login';
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="text-center">
                <p className="text-gray-400 text-xs md:text-sm">Icon Player</p>
                <p className="text-sm md:text-xl font-bold text-white truncate">{currentTeam?.icon_player_name}</p>
                <span className={`text-xs px-1 md:px-2 py-0.5 rounded-full ${getRoleColor(currentTeam?.icon_player_role || 'All-rounder')}`}>
                  {currentTeam?.icon_player_role}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="text-center">
                <p className="text-gray-400 text-xs md:text-sm">Team Owner</p>
                <p className="text-sm md:text-xl font-bold text-white truncate">{currentTeam?.owner_name}</p>
                <p className="text-[10px] md:text-xs text-yellow-400">★ Captain</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="text-center">
                <p className="text-gray-400 text-xs md:text-sm">Auction Players</p>
                <p className="text-xl md:text-3xl font-bold text-white">{teamPlayers.length}/9</p>
                <p className="text-[10px] md:text-xs text-gray-400">{getRemainingPlayers()} more needed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="text-center">
                <p className="text-gray-400 text-xs md:text-sm">Total Squad</p>
                <p className="text-xl md:text-3xl font-bold text-white">{getTotalSquadSize()}/11</p>
                <p className="text-[10px] md:text-xs text-gray-400">Icon + Owner</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('squad')}
            className={`px-3 md:px-4 py-2 text-sm md:text-base font-medium transition-colors ${
              activeTab === 'squad'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Squad ({getTotalSquadSize()}/11)
          </button>
          <button
            onClick={() => setActiveTab('auction')}
            className={`px-3 md:px-4 py-2 text-sm md:text-base font-medium transition-colors ${
              activeTab === 'auction'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Live Auction ({unsoldPlayers.length} left)
          </button>
        </div>

        {/* Squad View */}
        {activeTab === 'squad' && (
          <div className="space-y-4">
            {/* Role Breakdown */}
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-base md:text-xl">Squad Composition</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                  <div className="text-center p-2 bg-gray-800 rounded-lg">
                    <p className="text-lg md:text-2xl font-bold text-green-400">{getRoleCount('Batsman')}</p>
                    <p className="text-xs text-gray-400">Batsmen</p>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded-lg">
                    <p className="text-lg md:text-2xl font-bold text-red-400">{getRoleCount('Bowler')}</p>
                    <p className="text-xs text-gray-400">Bowlers</p>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded-lg">
                    <p className="text-lg md:text-2xl font-bold text-purple-400">{getRoleCount('All-rounder')}</p>
                    <p className="text-xs text-gray-400">All-rounders</p>
                  </div>
                  <div className="text-center p-2 bg-gray-800 rounded-lg">
                    <p className="text-lg md:text-2xl font-bold text-yellow-400">{getRoleCount('Wicket-keeper')}</p>
                    <p className="text-xs text-gray-400">Wicket-keepers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Players List */}
            <Card>
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="text-base md:text-xl">My Players ({getTotalSquadSize()}/11)</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                  {/* Icon Player Card */}
                  <div className="p-3 rounded-lg border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-white text-sm md:text-base">{currentTeam?.icon_player_name}</h3>
                        <p className="text-[10px] md:text-xs text-yellow-400">⭐ Icon Player</p>
                      </div>
                      <span className={`px-1 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs ${getRoleColor(currentTeam?.icon_player_role || 'All-rounder')}`}>
                        {getRoleIcon(currentTeam?.icon_player_role || 'All-rounder')} {currentTeam?.icon_player_role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Pre-assigned to team</p>
                    </div>
                  </div>

                  {/* Owner/Manager Card */}
                  <div className="p-3 rounded-lg border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-transparent">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold text-white text-sm md:text-base">{currentTeam?.owner_name}</h3>
                        <p className="text-[10px] md:text-xs text-blue-400">👑 Team Captain</p>
                      </div>
                      <span className="px-1 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs bg-blue-400/10 text-blue-400">
                        🏏 Captain
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Team Leader / All-rounder</p>
                    </div>
                  </div>

                  {/* Auction Players */}
                  {teamPlayers.map((player) => (
                    <div key={player.id} className="p-3 rounded-lg border border-gray-700 bg-gray-800/50">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-white text-sm md:text-base">{player.name}</h3>
                        <span className={`px-1 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs ${getRoleColor(player.role)}`}>
                          {getRoleIcon(player.role)} {player.role}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Sold for:</span>
                        <span className="text-yellow-400 font-semibold">{formatCurrency(player.sold_price || 0)}</span>
                      </div>
                    </div>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: getRemainingPlayers() }).map((_, index) => (
                    <div key={`empty-${index}`} className="p-3 rounded-lg border border-dashed border-gray-600 bg-gray-800/30">
                      <div className="text-center">
                        <p className="text-xl md:text-2xl mb-1">🎯</p>
                        <p className="text-xs text-gray-400">Slot Available</p>
                        <p className="text-[10px] text-gray-500">To be filled</p>
                      </div>
                    </div>
                  ))}

                  {teamPlayers.length === 0 && getRemainingPlayers() === 9 && (
                    <div className="col-span-full text-center text-gray-400 py-6 text-sm">
                      No players purchased yet. Check the Live Auction tab!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Auction View */}
        {activeTab === 'auction' && (
          <Card>
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-base md:text-xl">Live Auction</CardTitle>
              <p className="text-xs text-gray-400 mt-1">
                Watch the auction live! You need {getRemainingPlayers()} more players.
                {isOverBudget && <span className="text-red-400 block mt-1">⚠️ You are over budget by {formatCurrency(Math.abs(remainingBudget))}!</span>}
              </p>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 max-h-[500px] overflow-y-auto">
                {unsoldPlayers.map((player) => (
                  <div key={player.id} className="p-3 rounded-lg border border-gray-700 bg-gray-800/50">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-white text-sm md:text-base">{player.name}</h3>
                      <span className={`px-1 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs ${getRoleColor(player.role)}`}>
                        {getRoleIcon(player.role)} {player.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Base Price:</span>
                      <span className="text-yellow-400 font-semibold">{formatCurrency(player.base_price)}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-center text-gray-500">
                      ⏳ Waiting for admin...
                    </div>
                  </div>
                ))}
                {unsoldPlayers.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-6">
                    🎉 Auction completed! All players sold! 🎉
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}