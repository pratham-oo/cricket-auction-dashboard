'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

// Team logos mapping (update with your actual logo URLs)
const teamLogos: { [key: string]: string } = {
  '45 Blasters': '/logos/45-blasters.png',
  'HE Fighters': '/logos/he-fighters.png',
  'Gully Master': '/logos/gully-master.png',
  'Venom Knight Riders': '/logos/venom-knight-riders.png',
  "SKILLER'S": '/logos/skillers.png',
  'Skull Crusher': '/logos/skull-crusher.png',
};

// Fallback colors if logo not available
const teamColors: { [key: string]: string } = {
  '45 Blasters': 'from-blue-600 to-blue-400',
  'HE Fighters': 'from-red-600 to-red-400',
  'Gully Master': 'from-green-600 to-green-400',
  'Venom Knight Riders': 'from-purple-600 to-purple-400',
  "SKILLER'S": 'from-yellow-600 to-yellow-400',
  'Skull Crusher': 'from-gray-600 to-gray-400',
};

const matches = [
  { round: 1, turf1: { team1: 'Gully Master', team2: "SKILLER'S" }, turf2: { team1: 'HE Fighters', team2: 'Venom Knight Riders' } },
  { round: 2, turf1: { team1: '45 Blasters', team2: 'Skull Crusher' }, turf2: { team1: 'Gully Master', team2: 'Venom Knight Riders' } },
  { round: 3, turf1: { team1: '45 Blasters', team2: 'HE Fighters' }, turf2: { team1: "SKILLER'S", team2: 'Skull Crusher' } },
  { round: 4, turf1: { team1: '45 Blasters', team2: 'Venom Knight Riders' }, turf2: { team1: 'HE Fighters', team2: "SKILLER'S" } },
  { round: 5, turf1: { team1: 'Gully Master', team2: 'Skull Crusher' }, turf2: { team1: 'Venom Knight Riders', team2: "SKILLER'S" } },
  { round: 6, turf1: { team1: 'HE Fighters', team2: 'Skull Crusher' }, turf2: { team1: '45 Blasters', team2: "SKILLER'S" } },
  { round: 7, turf1: { team1: 'Venom Knight Riders', team2: 'Skull Crusher' }, turf2: { team1: 'HE Fighters', team2: 'Gully Master' } },
  { round: 8, turf1: { team1: '45 Blasters', team2: 'Gully Master' }, turf2: null },
];

// Helper component for match display
function MatchCard({ team1, team2, isFinal = false }: { team1: string; team2: string; isFinal?: boolean }) {
  const logo1 = teamLogos[team1];
  const logo2 = teamLogos[team2];
  const color1 = teamColors[team1] || 'from-gray-600 to-gray-400';
  const color2 = teamColors[team2] || 'from-gray-600 to-gray-400';

  return (
    <div className={`flex items-center justify-between gap-2 p-3 rounded-lg ${isFinal ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50' : 'bg-gray-800/50'}`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color1} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {logo1 ? (
            <img src={logo1} alt={team1} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            team1.charAt(0)
          )}
        </div>
        <span className="text-white font-medium text-sm truncate">{team1}</span>
      </div>
      
      <div className="text-gray-400 font-bold text-sm flex-shrink-0">VS</div>
      
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="text-white font-medium text-sm truncate">{team2}</span>
        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color2} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
          {logo2 ? (
            <img src={logo2} alt={team2} className="w-6 h-6 rounded-full object-cover" />
          ) : (
            team2.charAt(0)
          )}
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            League Match Schedule
          </h1>
          <p className="text-center text-gray-400 mt-2">
            🏏 8 Rounds | 2 Turfs | 15 Matches
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Legend */}
        <div className="mb-6 p-3 bg-gray-800/50 rounded-lg flex flex-wrap justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500/50 rounded"></div>
            <span>Final Match</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-700 rounded"></div>
            <span>Regular Match</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏟️</span>
            <span>Turf 1</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏟️</span>
            <span>Turf 2</span>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center font-bold text-gray-300 py-2 px-4 bg-gray-800/50 rounded-lg">
                ROUND
              </div>
              <div className="text-center font-bold text-blue-400 py-2 px-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                🏟️ TURF 1
              </div>
              <div className="text-center font-bold text-purple-400 py-2 px-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                🏟️ TURF 2
              </div>
            </div>

            {/* Rows */}
            {matches.map((match, index) => {
              const isFinal = match.round === 8;
              return (
                <div key={match.round} className="grid grid-cols-3 gap-4 mb-4">
                  {/* Round Number */}
                  <div className="flex items-center justify-center">
                    <div className={`text-center font-bold text-white py-2 px-4 rounded-lg w-full ${
                      isFinal ? 'bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-500' : 'bg-gray-800/50'
                    }`}>
                      Round {match.round}
                      {isFinal && <span className="ml-2 text-yellow-400 text-xs">⭐ FINAL</span>}
                    </div>
                  </div>

                  {/* Turf 1 */}
                  <div className="bg-gray-900/30 rounded-lg p-2 border border-gray-800">
                    <div className="text-xs text-blue-400 mb-2 text-center">🏟️ TURF 1</div>
                    <MatchCard 
                      team1={match.turf1.team1} 
                      team2={match.turf1.team2}
                      isFinal={isFinal}
                    />
                  </div>

                  {/* Turf 2 */}
                  <div className="bg-gray-900/30 rounded-lg p-2 border border-gray-800">
                    <div className="text-xs text-purple-400 mb-2 text-center">🏟️ TURF 2</div>
                    {match.turf2 ? (
                      <MatchCard 
                        team1={match.turf2.team1} 
                        team2={match.turf2.team2}
                        isFinal={false}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-[68px] text-gray-500 text-sm">
                        No Match
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Teams Participating */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl text-white text-center">🏆 Participating Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.keys(teamLogos).map((team) => (
                <div key={team} className="flex flex-col items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${teamColors[team]} flex items-center justify-center text-white font-bold text-lg`}>
                    {team.charAt(0)}
                  </div>
                  <p className="text-white text-xs text-center mt-2">{team}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-6 mt-8">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>🏏 League Matches | 2 Turfs | 8 Rounds</p>
            <p className="mt-1">Developed by Pratham Shinde</p>
          </div>
        </footer>
      </div>
    </div>
  );
}