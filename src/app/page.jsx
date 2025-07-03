"use client"

import React, { useState, useEffect } from 'react';
import { ChevronRight, Trophy, Users, Shuffle, Play, X, Plus, Moon, Sun } from 'lucide-react';

const TournamentBracket = () => {
  const [participants, setParticipants] = useState([]);
  const [bracket, setBracket] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme configurations
  const themes = {
    light: {
      background: 'bg-gradient-to-br from-blue-50 to-purple-50',
      card: 'bg-white',
      cardBorder: 'border-gray-100',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-400',
      input: 'bg-white border-gray-200 text-gray-900 placeholder-gray-500',
      participantBg: 'bg-gradient-to-r from-gray-50 to-gray-100',
      participantHover: 'hover:from-gray-100 hover:to-gray-200',
      matchInactive: 'bg-white border-gray-200',
      matchActive: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300',
      matchCompleted: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300',
      matchBye: 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300',
      playerHover: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50',
      playerCompleted: 'bg-gray-100 text-gray-400',
      buttonPrimary: 'from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700',
      buttonSecondary: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
      buttonSuccess: 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700',
      themeToggle: 'bg-white border-gray-200',
      themeIcon: 'text-gray-700',
    },
    dark: {
      background: 'bg-gradient-to-br from-gray-900 to-purple-950',
      card: 'bg-gray-800',
      cardBorder: 'border-gray-700',
      text: 'text-white',
      textSecondary: 'text-gray-300',
      textMuted: 'text-gray-500',
      input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400',
      participantBg: 'bg-gradient-to-r from-gray-700 to-gray-600',
      participantHover: 'hover:from-gray-600 hover:to-gray-500',
      matchInactive: 'bg-gray-700 border-gray-600',
      matchActive: 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-700',
      matchCompleted: 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-700',
      matchBye: 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-700',
      playerHover: 'hover:bg-gradient-to-r hover:from-blue-900/20 hover:to-indigo-900/20',
      playerCompleted: 'bg-gray-800 text-gray-500',
      buttonPrimary: 'from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800',
      buttonSecondary: 'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
      buttonSuccess: 'from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800',
      themeToggle: 'bg-gray-800 border-gray-700',
      themeIcon: 'text-yellow-500',
    }
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  // Initialize theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('bracketTheme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setIsDarkMode(true);
      }
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('bracketTheme', newMode ? 'dark' : 'light');
  };

  // Get next power of 2
  const getNextPowerOfTwo = (n) => {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  };

  // Initialize bracket structure with proper BYE handling
  const initializeBracket = (players) => {
    const rounds = [];
    const nextPowerOfTwo = getNextPowerOfTwo(players.length);
    
    let currentRoundPlayers = [...players];
    const byesNeeded = nextPowerOfTwo - players.length;
    
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
        
        if (match.isBye) {
          match.winner = player1 === 'BYE' ? player2 : player1;
          match.completed = true;
        }
        
        matches.push(match);
      }
      rounds.push(matches);
      
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
    
    if (match.isBye || winner === 'BYE') return;
    
    match.winner = winner;
    match.completed = true;
    
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

  // Theme Toggle Button Component
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className={`fixed top-4 right-4 p-3 ${theme.themeToggle} rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border z-50`}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className={`w-5 h-5 ${theme.themeIcon}`} />
      ) : (
        <Moon className={`w-5 h-5 ${theme.themeIcon}`} />
      )}
    </button>
  );

  // Setup page
  if (!isSetupComplete) {
    return (
      <div className={`min-h-screen ${theme.background} p-4 transition-colors duration-300`}>
        <ThemeToggle />
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className={`text-5xl font-bold ${theme.text} mb-3`}>Tournament Bracket</h1>
            <p className={`text-xl ${theme.textSecondary}`}>Create your championship journey</p>
          </div>
          
          <div className={`${theme.card} rounded-2xl shadow-xl p-8 mb-6 border ${theme.cardBorder}`}>
            <h2 className={`text-2xl font-semibold ${theme.text} mb-6`}>Add Participants</h2>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                placeholder="Enter participant name"
                className={`flex-1 px-4 py-3 ${theme.input} border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
              />
              <button
                onClick={addParticipant}
                className={`px-6 py-3 bg-gradient-to-r ${theme.buttonPrimary} text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2`}
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
            
            <div className="space-y-2 mb-8 max-h-96 overflow-y-auto">
              {participants.map((participant, index) => (
                <div key={index} className={`flex items-center justify-between ${theme.participantBg} p-4 rounded-xl ${theme.participantHover} transition-all group`}>
                  <span className={`font-medium ${theme.text}`}>{participant}</span>
                  <button
                    onClick={() => removeParticipant(index)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {participants.length === 0 && (
                <div className={`text-center py-12 ${theme.textMuted}`}>
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No participants yet. Add some players to get started!</p>
                </div>
              )}
            </div>
            
            <div className={`flex items-center justify-between pt-6 border-t ${theme.cardBorder === 'border-gray-100' ? 'border-gray-200' : 'border-gray-700'}`}>
              <div className={`flex items-center gap-3 ${theme.textSecondary}`}>
                <div className={`flex items-center justify-center w-10 h-10 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full`}>
                  <Users className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <span className="font-medium">{participants.length} participants</span>
              </div>
              
              <button
                onClick={startTournament}
                disabled={participants.length < 2}
                className={`flex items-center gap-3 px-8 py-3 bg-gradient-to-r ${theme.buttonSuccess} ${participants.length < 2 ? 'from-gray-300 to-gray-400 cursor-not-allowed' : ''} text-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none`}
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
    <div className={`min-h-screen ${theme.background} p-4 transition-colors duration-300`}>
      <ThemeToggle />
      <div className="max-w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-bold ${theme.text} mb-4`}>Tournament Bracket</h1>
          <button
            onClick={resetTournament}
            className={`px-6 py-2 bg-gradient-to-r ${theme.buttonSecondary} text-white rounded-xl transition-all shadow-md hover:shadow-lg`}
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

        <div className={`${theme.card} rounded-2xl shadow-xl p-8 overflow-x-auto border ${theme.cardBorder}`}>
          <div className="flex items-stretch gap-8 min-w-max">
            {bracket.map((round, roundIndex) => (
              <div key={roundIndex} className="flex flex-col">
                <h3 className={`text-xl font-bold text-center mb-6 ${theme.textSecondary}`}>
                  {getRoundName(roundIndex, bracket.length)}
                </h3>
                
                <div className="flex flex-col justify-around flex-1 gap-4">
                  {round.map((match, matchIndex) => (
                    <div
                      key={match.id}
                      className={`relative rounded-xl overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl w-72 ${
                        match.completed
                          ? match.isBye
                            ? theme.matchBye
                            : theme.matchCompleted
                          : roundIndex === currentRound
                          ? theme.matchActive
                          : theme.matchInactive
                      } border-2`}
                    >
                      {match.isBye ? (
                        <div className="p-6 text-center">
                          <div className={`text-xl font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'} mb-2`}>
                            {match.winner}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} ${isDarkMode ? 'bg-yellow-800/30' : 'bg-yellow-200'} px-4 py-1 rounded-full inline-block`}>
                            Advances (Bye)
                          </div>
                        </div>
                      ) : (
                        <div>
                          {match.player1 && match.player1 !== 'BYE' && (
                            <button
                              onClick={() => !match.completed && selectWinner(roundIndex, matchIndex, match.player1)}
                              disabled={match.completed || !match.player2 || match.player2 === 'BYE'}
                              className={`w-full px-6 py-4 text-left transition-all duration-200 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} ${
                                match.winner === match.player1
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold'
                                  : match.completed
                                  ? theme.playerCompleted
                                  : `${theme.playerHover} cursor-pointer ${theme.text}`
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
                                  ? theme.playerCompleted
                                  : `${theme.playerHover} cursor-pointer ${theme.text}`
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
                            <div className={`px-6 py-8 text-center ${theme.textMuted}`}>
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