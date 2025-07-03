"use client"
import React, { useState, useEffect } from 'react';
import { ChevronRight, Trophy, Users, Shuffle, Play, X, Plus } from 'lucide-react';

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

  // Setup page
  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-3">Tournament Bracket</h1>
            <p className="text-xl text-gray-600">Create your championship journey</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add Participants</h2>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                placeholder="Enter participant name"
                className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={addParticipant}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
            
            <div className="space-y-2 mb-8 max-h-96 overflow-y-auto">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all group">
                  <span className="font-medium text-gray-800">{participant}</span>
                  <button
                    onClick={() => removeParticipant(index)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {participants.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No participants yet. Add some players to get started!</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-gray-600">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium">{participants.length} participants</span>
              </div>
              
              <button
                onClick={startTournament}
                disabled={participants.length < 2}
                className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
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

  // Bracket view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Tournament Bracket</h1>
          <button
            onClick={resetTournament}
            className="px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all shadow-md hover:shadow-lg"
          >
            Reset Tournament
          </button>
        </div>

        {champion && (
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white p-8 rounded-2xl shadow-2xl max-w-md mx-auto transform hover:scale-105 transition-transform">
              <Trophy className="w-20 h-20 mx-auto mb-4 animate-bounce" />
              <h2 className="text-3xl font-bold mb-3">🎉 Champion! 🎉</h2>
              <p className="text-2xl font-bold">{champion}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 overflow-x-auto border border-gray-100">
          <div className="flex items-stretch gap-8 min-w-max">
            {bracket.map((round, roundIndex) => (
              <div key={roundIndex} className="flex flex-col">
                <h3 className="text-xl font-bold text-center mb-6 text-gray-700">
                  {getRoundName(roundIndex, bracket.length)}
                </h3>
                
                <div className="flex flex-col justify-around flex-1 gap-4">
                  {round.map((match, matchIndex) => (
                    <div
                      key={match.id}
                      className={`relative rounded-xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl w-72 ${
                        match.completed
                          ? match.isBye
                            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300'
                            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300'
                          : roundIndex === currentRound
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300'
                          : 'bg-white border-2 border-gray-200'
                      }`}
                    >
                      {match.isBye ? (
                        <div className="p-6 text-center">
                          <div className="text-xl font-bold text-yellow-700 mb-2">
                            {match.winner}
                          </div>
                          <div className="text-sm text-yellow-600 bg-yellow-200 px-4 py-1 rounded-full inline-block">
                            Advances (Bye)
                          </div>
                        </div>
                      ) : (
                        <div>
                          {match.player1 && match.player1 !== 'BYE' && (
                            <button
                              onClick={() => !match.completed && selectWinner(roundIndex, matchIndex, match.player1)}
                              disabled={match.completed || !match.player2 || match.player2 === 'BYE'}
                              className={`w-full px-6 py-4 text-left transition-all duration-200 border-b border-gray-200 ${
                                match.winner === match.player1
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold'
                                  : match.completed
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer text-gray-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{match.player1}</span>
                                {match.winner === match.player1 && (
                                  <Trophy className="w-5 h-5" />
                                )}
                              </div>
                            </button>
                          )}
                          
                          {match.player2 && match.player2 !== 'BYE' && (
                            <button
                              onClick={() => !match.completed && selectWinner(roundIndex, matchIndex, match.player2)}
                              disabled={match.completed || !match.player1 || match.player1 === 'BYE'}
                              className={`w-full px-6 py-4 text-left transition-all duration-200 ${
                                match.winner === match.player2
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold'
                                  : match.completed
                                  ? 'bg-gray-100 text-gray-400'
                                  : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer text-gray-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{match.player2}</span>
                                {match.winner === match.player2 && (
                                  <Trophy className="w-5 h-5" />
                                )}
                              </div>
                            </button>
                          )}
                          
                          {(!match.player1 || match.player1 === 'BYE') && (!match.player2 || match.player2 === 'BYE') && (
                            <div className="px-6 py-8 text-center text-gray-400">
                              Waiting for players...
                            </div>
                          )}
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