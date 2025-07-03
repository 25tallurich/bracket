"use client"

import React, { useState, useEffect } from 'react';
import { ChevronRight, Trophy, Users, Shuffle, Play } from 'lucide-react';

const TournamentBracket = () => {
  const [participants, setParticipants] = useState([]);
  const [bracket, setBracket] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);

  // Get next power of 2
  const getNextPowerOfTwo = (n) => {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  };

  // Initialize bracket structure with proper BYE handling
  const initializeBracket = (players) => {
    const rounds = [];
    const nextPowerOfTwo = getNextPowerOfTwo(players.length);
    
    // Create first round with BYEs if needed
    let currentRoundPlayers = [...players];
    const byesNeeded = nextPowerOfTwo - players.length;
    
    // Add BYEs to make it a perfect power of 2
    for (let i = 0; i < byesNeeded; i++) {
      currentRoundPlayers.push('BYE');
    }
    
    while (currentRoundPlayers.length > 1) {
      const matches = [];
      for (let i = 0; i < currentRoundPlayers.length; i += 2) {
        const player1 = currentRoundPlayers[i];
        const player2 = currentRoundPlayers[i + 1];
        
        const match = {
          id: `match-${rounds.length}-${i/2}`,
          player1: player1,
          player2: player2,
          winner: null,
          completed: false,
          isBye: player1 === 'BYE' || player2 === 'BYE'
        };
        
        // Auto-advance for BYE matches
        if (match.isBye) {
          match.winner = player1 === 'BYE' ? player2 : player1;
          match.completed = true;
        }
        
        matches.push(match);
      }
      rounds.push(matches);
      
      // Prepare next round players
      currentRoundPlayers = matches.map(match => match.winner || null);
    }
    
    return rounds;
  };

  // Shuffle array function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Add participant
  const addParticipant = () => {
    if (currentInput.trim() && !participants.includes(currentInput.trim())) {
      setParticipants([...participants, currentInput.trim()]);
      setCurrentInput('');
    }
  };

  // Remove participant
  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  // Start tournament
  const startTournament = () => {
    if (participants.length < 2) return;
    
    // Remove any existing BYE entries and randomize
    const realPlayers = participants.filter(p => p !== 'BYE');
    const shuffledPlayers = shuffleArray(realPlayers);
    const newBracket = initializeBracket(shuffledPlayers);
    
    setBracket(newBracket);
    setCurrentRound(0);
    setIsSetupComplete(true);
  };

  // Select winner
  const selectWinner = (roundIndex, matchIndex, winner) => {
    const newBracket = [...bracket];
    const match = newBracket[roundIndex][matchIndex];
    
    // Don't allow selection for BYE matches or if winner is BYE
    if (match.isBye || winner === 'BYE') return;
    
    match.winner = winner;
    match.completed = true;
    
    // Update next round
    if (roundIndex + 1 < newBracket.length) {
      const nextRoundMatchIndex = Math.floor(matchIndex / 2);
      const isFirstPlayer = matchIndex % 2 === 0;
      
      if (isFirstPlayer) {
        newBracket[roundIndex + 1][nextRoundMatchIndex].player1 = winner;
      } else {
        newBracket[roundIndex + 1][nextRoundMatchIndex].player2 = winner;
      }
    }
    
    setBracket(newBracket);
    
    // Check if round is complete
    const roundComplete = newBracket[roundIndex].every(match => match.completed);
    if (roundComplete && roundIndex + 1 < newBracket.length) {
      setCurrentRound(roundIndex + 1);
    }
  };

  // Reset tournament
  const resetTournament = () => {
    setIsSetupComplete(false);
    setBracket([]);
    setCurrentRound(0);
  };

  // Get round name
  const getRoundName = (roundIndex, totalRounds) => {
    if (roundIndex === totalRounds - 1) return 'Final';
    if (roundIndex === totalRounds - 2) return 'Semi-Final';
    if (roundIndex === totalRounds - 3) return 'Quarter-Final';
    return `Round ${roundIndex + 1}`;
  };

  // Check if tournament is complete
  const isTournamentComplete = () => {
    return bracket.length > 0 && bracket[bracket.length - 1][0]?.completed;
  };

  const champion = isTournamentComplete() ? bracket[bracket.length - 1][0].winner : null;

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Tournament Bracket</h1>
            <p className="text-gray-600">Set up your tournament participants</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                placeholder="Enter participant name"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addParticipant}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">{participant}</span>
                  <button
                    onClick={() => removeParticipant(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span>{participants.length} participants</span>
              </div>
              
              <button
                onClick={startTournament}
                disabled={participants.length < 2}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Shuffle className="w-5 h-5" />
                Start Tournament
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tournament Bracket</h1>
          <div className="flex justify-center gap-4">
            <button
              onClick={resetTournament}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Reset Tournament
            </button>
          </div>
        </div>

        {champion && (
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <Trophy className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">🏆 Champion! 🏆</h2>
              <p className="text-xl font-semibold">{champion}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
          <div className="flex gap-8 min-w-max relative">
            {bracket.map((round, roundIndex) => (
              <div key={roundIndex} className="flex flex-col min-w-[250px] relative">
                <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">
                  {getRoundName(roundIndex, bracket.length)}
                </h3>
                
                {/* Calculate spacing for centering */}
                <div 
                  className="flex flex-col justify-center gap-4 relative"
                  style={{
                    height: `${bracket[0].length * 120}px`,
                    paddingTop: `${Math.pow(2, roundIndex) * 20}px`
                  }}
                >
                  {round.map((match, matchIndex) => (
                    <div key={match.id} className="relative">
                      <div
                        className={`border-2 rounded-lg p-4 transition-all duration-300 relative ${
                          match.completed
                            ? match.isBye
                              ? 'border-yellow-300 bg-yellow-50'
                              : 'border-green-300 bg-green-50'
                            : roundIndex === currentRound
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        style={{
                          marginBottom: `${Math.pow(2, roundIndex + 1) * 20}px`
                        }}
                      >
                        {match.isBye ? (
                          <div className="text-center py-6">
                            <div className="text-lg font-semibold text-yellow-600 mb-2">
                              {match.winner}
                            </div>
                            <div className="text-sm text-yellow-500 bg-yellow-100 px-3 py-1 rounded-full inline-block">
                              🎯 Bye - Advances Automatically
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {match.player1 && match.player1 !== 'BYE' && (
                              <button
                                onClick={() => !match.completed && selectWinner(roundIndex, matchIndex, match.player1)}
                                disabled={match.completed || !match.player2 || match.player2 === 'BYE'}
                                className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                                  match.winner === match.player1
                                    ? 'bg-green-500 text-white font-semibold'
                                    : match.completed
                                    ? 'bg-gray-200 text-gray-500'
                                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                {match.player1}
                              </button>
                            )}
                            
                            {match.player1 && match.player1 !== 'BYE' && match.player2 && match.player2 !== 'BYE' && (
                              <div className="text-center text-gray-400 text-sm">vs</div>
                            )}
                            
                            {match.player2 && match.player2 !== 'BYE' && (
                              <button
                                onClick={() => !match.completed && selectWinner(roundIndex, matchIndex, match.player2)}
                                disabled={match.completed || !match.player1 || match.player1 === 'BYE'}
                                className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                                  match.winner === match.player2
                                    ? 'bg-green-500 text-white font-semibold'
                                    : match.completed
                                    ? 'bg-gray-200 text-gray-500'
                                    : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                {match.player2}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Connection lines to next round */}
                      {roundIndex < bracket.length - 1 && (
                        <div className="absolute top-1/2 -right-8 w-8 h-0.5 bg-gray-300 transform -translate-y-1/2">
                          <div className="absolute -right-0.5 -top-0.5 w-1 h-1 bg-gray-300 rounded-full"></div>
                        </div>
                      )}
                      
                      {/* Vertical connecting lines */}
                      {roundIndex < bracket.length - 1 && matchIndex % 2 === 0 && matchIndex + 1 < round.length && (
                        <div
                          className="absolute top-1/2 -right-8 w-8 border-r-2 border-gray-300"
                          style={{
                            height: `${Math.pow(2, roundIndex + 1) * 20 + 80}px`,
                            transform: 'translateY(-50%)'
                          }}
                        >
                          <div className="absolute right-0 top-1/2 w-8 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentBracket;