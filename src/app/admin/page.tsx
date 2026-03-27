'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuction } from '@/hooks/useAuction';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, getRoleColor, getRoleIcon } from '@/lib/utils';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const {
    players,
    teams,
    logs,
    loading,
    selectedPlayer,
    setSelectedPlayer,
    currentBid,
    setCurrentBid,
    sellPlayer,
    undoSale,
    getUnsoldPlayers,
    getSoldPlayers,
  } = useAuction();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isSelling, setIsSelling] = useState(false);

  // Protect admin route - redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const unsoldPlayers = getUnsoldPlayers();
  const soldPlayers = getSoldPlayers();
  
  const filteredPlayers = unsoldPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || player.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSell = async () => {
    // Prevent multiple clicks
    if (isSelling) {
      return;
    }
    
    if (!selectedPlayer || !selectedTeam) {
      alert('Please select a player and team');
      return;
    }
    
    if (currentBid < selectedPlayer.base_price) {
      alert(`Bid must be at least ${selectedPlayer.base_price}`);
      return;
    }

    setIsSelling(true);
    try {
      const success = await sellPlayer(selectedPlayer.id, selectedTeam, currentBid);
      if (success) {
        setSelectedPlayer(null);
        setCurrentBid(25);
        setSelectedTeam('');
      }
    } finally {
      setIsSelling(false);
    }
  };

  const handleUndo = async (logId: string) => {
    const success = await undoSale(logId);
    if (success) {
      console.log('Undo successful');
    }
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-white text-xl">Loading auction data...</div>
      </div>
    );
  }

  // If not admin, don't render the page (redirect will happen)
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Auction Control
              </h1>
              <p className="text-gray-400 text-xs md:text-sm">Welcome, Admin</p>
            </div>
            <div className="flex gap-2 md:gap-4 items-center">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-400">Remaining</div>
                <div className="text-lg md:text-2xl font-bold text-white">{unsoldPlayers.length}/54</div>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-400">Sold</div>
                <div className="text-lg md:text-2xl font-bold text-green-400">{soldPlayers.length}</div>
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
          {/* Mobile Stats */}
          <div className="flex justify-between mt-2 sm:hidden">
            <div className="text-center">
              <div className="text-xs text-gray-400">Remaining</div>
              <div className="text-lg font-bold text-white">{unsoldPlayers.length}/54</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Sold</div>
              <div className="text-lg font-bold text-green-400">{soldPlayers.length}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
          {/* Player List Section */}
          <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg md:text-xl">Available Players</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-rounder">All-rounder</option>
                    <option value="Wicket-keeper">Wicket-keeper</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
                  {filteredPlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayer(player);
                      }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPlayer?.id === player.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-white text-sm">{player.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getRoleColor(player.role)}`}>
                          {getRoleIcon(player.role)} {player.role}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Base Price:</span>
                        <span className="text-yellow-400 font-semibold">{formatCurrency(player.base_price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredPlayers.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    No players found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Auction Controls Section */}
          <div className="space-y-4 order-1 lg:order-2">
            {/* Sell Player Card */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg md:text-xl">Sell Player</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {selectedPlayer ? (
                  <>
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-400">Selected Player</p>
                      <p className="text-base font-bold text-white">{selectedPlayer.name}</p>
                      <p className={`text-xs ${getRoleColor(selectedPlayer.role)}`}>
                        {selectedPlayer.role}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-300">
                        Select Team
                      </label>
                      <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                      >
                        <option value="">Choose a team...</option>
                        {teams.map((team) => {
                          const auctionPlayersCount = players.filter(p => p.sold_to === team.id).length;
                          const maxReached = auctionPlayersCount >= 9;
                          const isOverBudget = team.budget < 0;
                          
                          return (
                            <option 
                              key={team.id} 
                              value={team.id}
                              disabled={maxReached}
                              className={maxReached ? 'text-gray-500' : 'text-white'}
                            >
                              {team.team_name} | Budget: {formatCurrency(team.budget)} | Players: {auctionPlayersCount}/9
                              {isOverBudget && ' 🔴 OVER'}
                              {maxReached && ' (FULL)'}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-300">
                        Bid Amount (Min: {selectedPlayer.base_price})
                      </label>
                      <input
                        type="number"
                        value={currentBid}
                        onChange={(e) => setCurrentBid(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm"
                        min={selectedPlayer.base_price}
                        step={5}
                      />
                    </div>

                    <Button 
                      onClick={handleSell} 
                      className="w-full text-sm" 
                      variant="success"
                      disabled={isSelling}
                    >
                      {isSelling ? 'Selling...' : 'Confirm Sale'}
                    </Button>

                    <Button
                      onClick={() => {
                        setSelectedPlayer(null);
                        setSelectedTeam('');
                        setCurrentBid(25);
                      }}
                      variant="outline"
                      className="w-full text-sm"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-6 text-sm">
                    Select a player to start bidding
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Stats Card */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg md:text-xl">Team Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {teams.map((team) => {
                    const auctionPlayersCount = players.filter(p => p.sold_to === team.id).length;
                    const totalPlayers = 2 + auctionPlayersCount;
                    const progressPercentage = (auctionPlayersCount / 9) * 100;
                    const isComplete = auctionPlayersCount >= 9;
                    const isOverBudget = team.budget < 0;
                    
                    return (
                      <div key={team.id} className="p-2 bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm">{team.team_name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              Icon: {team.icon_player_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${isOverBudget ? 'text-red-500' : team.budget < 100 ? 'text-orange-400' : 'text-green-400'}`}>
                              {formatCurrency(team.budget)}
                            </p>
                            <p className="text-xs text-gray-400">Budget</p>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Auction: {auctionPlayersCount}/9</span>
                            <span>Total: {totalPlayers}/11</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${isComplete ? 'bg-green-500' : isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.min(100, progressPercentage)}%` }}
                            />
                          </div>
                        </div>
                        
                        {isOverBudget && (
                          <div className="mt-1 text-xs text-red-400 font-semibold">
                            ⚠️ OVER BUDGET: {formatCurrency(Math.abs(team.budget))} overspent!
                          </div>
                        )}
                        {!isOverBudget && team.budget < 100 && auctionPlayersCount < 9 && (
                          <div className="mt-1 text-xs text-orange-400">
                            ⚠️ Low budget! Only {formatCurrency(team.budget)} left
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Sales Card */}
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg md:text-xl">Recent Sales</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {logs.slice(0, 10).map((log) => {
                    const player = players.find(p => p.id === log.player_id);
                    const team = teams.find(t => t.id === log.team_id);
                    return (
                      <div key={log.id} className="p-2 bg-gray-800 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm">{player?.name}</p>
                            <p className="text-xs text-gray-400">to {team?.team_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-yellow-400 font-bold text-sm">{formatCurrency(log.price)}</p>
                            {log.action === 'sold' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUndo(log.id)}
                                className="mt-1 text-xs h-6 px-2"
                              >
                                Undo
                              </Button>
                            )}
                            {log.action === 'undo' && (
                              <span className="text-xs text-red-400">Undone</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {logs.length === 0 && (
                    <div className="text-center text-gray-400 py-4 text-sm">
                      No sales yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}