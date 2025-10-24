"use client"
import React, { useState, useEffect } from 'react';
import { ChevronRight, Trophy, Users, Shuffle, Play, X, Plus, Moon, Sun, Share2, History, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Tournament, Match as DBMatch } from '@/lib/supabase';

// Type definitions
interface Match {
  id: string;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  completed: boolean;
  isBye: boolean;
}

type Round = Match[];
type Bracket = Round[];

interface Theme {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  input: string;
  participantBg: string;
  participantHover: string;
  matchInactive: string;
  matchActive: string;
  matchCompleted: string;
  matchBye: string;
  playerHover: string;
  playerCompleted: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonSuccess: string;
  themeToggle: string;
  themeIcon: string;
}

interface Themes {
  light: Theme;
  dark: Theme;
}

const TournamentBracket: React.FC = () => {
  const [participants, setParticipants] = useState<string[]>([]);
  const [bracket, setBracket] = useState<Bracket>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [tournamentName, setTournamentName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Theme configurations
  const themes: Themes = {
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

  // Check for tournament ID in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('tournament');
    if (id) {
      loadTournament(id);
    }
  }, []);

  // Toggle theme
  const toggleTheme = (): void => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('bracketTheme', newMode ? 'dark' : 'light');
  };

  // Get next power of 2
  const getNextPowerOfTwo = (n: number): number => {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  };

  // Initialize bracket structure with proper BYE handling
  const initializeBracket = (players: string[]): Bracket => {
    const rounds: Bracket = [];
    const nextPowerOfTwo = getNextPowerOfTwo(players.length);
    
    let currentRoundPlayers: (string | null)[] = [...players];
    const byesNeeded = nextPowerOfTwo - players.length;
    
    for (let i = 0; i < byesNeeded; i++) {
      currentRoundPlayers.push('BYE');
    }
    
    while (currentRoundPlayers.length > 1) {
      const matches: Round = [];
      for (let i = 0; i < currentRoundPlayers.length; i += 2) {
        const player1 = currentRoundPlayers[i];
        const player2 = currentRoundPlayers[i + 1];
        
        const match: Match = {
          id: `match-${rounds.length}-${i/2}`,
          player1: player1,
          player2: player2 || null,
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
      
      currentRoundPlayers = matches.map(match => match.winner);
    }
    
    return rounds;
  };

  // Shuffle array function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Add participant
  const addParticipant = (): void => {
    if (currentInput.trim() && !participants.includes(currentInput.trim())) {
      setParticipants([...participants, currentInput.trim()]);
      setCurrentInput('');
    }
  };

  // Remove participant
  const removeParticipant = (index: number): void => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  // Save tournament to Supabase
  const saveTournamentToDB = async (bracket: Bracket, name: string): Promise<string | null> => {
    try {
      setLoading(true);
      
      // Create tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .insert({
          name: name || 'Untitled Tournament',
          status: 'in_progress',
          current_round: 0,
          total_rounds: bracket.length
        })
        .select()
        .single();

      if (tournamentError) throw tournamentError;

      // Save participants
      const participantsData = participants.map((name, index) => ({
        tournament_id: tournament.id,
        name: name,
        seed_position: index
      }));

      const { error: participantsError } = await supabase
        .from('participants')
        .insert(participantsData);

      if (participantsError) throw participantsError;

      // Save matches
      const matchesData: any[] = [];
      bracket.forEach((round, roundIndex) => {
        round.forEach((match, matchIndex) => {
          matchesData.push({
            tournament_id: tournament.id,
            round_index: roundIndex,
            match_index: matchIndex,
            player1: match.player1,
            player2: match.player2,
            winner: match.winner,
            completed: match.completed,
            is_bye: match.isBye
          });
        });
      });

      const { error: matchesError } = await supabase
        .from('matches')
        .insert(matchesData);

      if (matchesError) throw matchesError;

      return tournament.id;
    } catch (error) {
      console.error('Error saving tournament:', error);
      alert('Failed to save tournament. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load tournament from Supabase
  const loadTournament = async (id: string): Promise<void> => {
    try {
      setLoading(true);

      // Load tournament
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (tournamentError) throw tournamentError;

      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('participants')
        .select('*')
        .eq('tournament_id', id)
        .order('seed_position');

      if (participantsError) throw participantsError;

      // Load matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', id)
        .order('round_index')
        .order('match_index');

      if (matchesError) throw matchesError;

      // Reconstruct bracket
      const rounds: Bracket = [];
      const totalRounds = tournament.total_rounds || 0;

      for (let i = 0; i < totalRounds; i++) {
        const roundMatches = matchesData
          .filter((m: DBMatch) => m.round_index === i)
          .map((m: DBMatch) => ({
            id: m.id,
            player1: m.player1,
            player2: m.player2,
            winner: m.winner,
            completed: m.completed,
            isBye: m.is_bye
          }));
        rounds.push(roundMatches);
      }

      setTournamentId(id);
      setTournamentName(tournament.name);
      setParticipants(participantsData.map((p) => p.name));
      setBracket(rounds);
      setCurrentRound(tournament.current_round);
      setIsSetupComplete(true);
    } catch (error) {
      console.error('Error loading tournament:', error);
      alert('Failed to load tournament. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update match in database
  const updateMatchInDB = async (tournamentId: string, matchId: string, winner: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ winner, completed: true })
        .eq('id', matchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating match:', error);
    }
  };

  // Update tournament status
  const updateTournamentStatus = async (tournamentId: string, status: string, currentRound: number, champion?: string): Promise<void> => {
    try {
      const updateData: any = { status, current_round: currentRound };
      if (champion) updateData.champion = champion;

      const { error } = await supabase
        .from('tournaments')
        .update(updateData)
        .eq('id', tournamentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating tournament:', error);
    }
  };

  // Start tournament
  const startTournament = async (): Promise<void> => {
    if (participants.length < 2) return;
    
    const realPlayers = participants.filter(p => p !== 'BYE');
    const shuffledPlayers = shuffleArray(realPlayers);
    const newBracket = initializeBracket(shuffledPlayers);
    
    const id = await saveTournamentToDB(newBracket, tournamentName);
    
    if (id) {
      setTournamentId(id);
      setBracket(newBracket);
      setCurrentRound(0);
      setIsSetupComplete(true);

      // Update URL with tournament ID
      window.history.pushState({}, '', `?tournament=${id}`);
    }
  };

  // Select winner
  const selectWinner = async (roundIndex: number, matchIndex: number, winner: string): Promise<void> => {
    const newBracket = [...bracket];
    const match = newBracket[roundIndex][matchIndex];
    
    if (match.isBye || winner === 'BYE') return;
    
    match.winner = winner;
    match.completed = true;
    
    // Update database
    if (tournamentId) {
      await updateMatchInDB(tournamentId, match.id, winner);
    }

    // Update next round
    if (roundIndex + 1 < newBracket.length) {
      const nextRoundMatchIndex = Math.floor(matchIndex / 2);
      const isFirstPlayer = matchIndex % 2 === 0;
      
      if (isFirstPlayer) {
        newBracket[roundIndex + 1][nextRoundMatchIndex].player1 = winner;
      } else {
        newBracket[roundIndex + 1][nextRoundMatchIndex].player2 = winner;
      }

      // Update next round match in database
      if (tournamentId) {
        const nextMatch = newBracket[roundIndex + 1][nextRoundMatchIndex];
        await supabase
          .from('matches')
          .update({
            player1: nextMatch.player1,
            player2: nextMatch.player2
          })
          .eq('id', nextMatch.id);
      }
    }
    
    setBracket(newBracket);
    
    // Check if round is complete
    const roundComplete = newBracket[roundIndex].every(match => match.completed);
    if (roundComplete && roundIndex + 1 < newBracket.length) {
      const newRound = roundIndex + 1;
      setCurrentRound(newRound);
      
      if (tournamentId) {
        await updateTournamentStatus(tournamentId, 'in_progress', newRound);
      }
    }

    // Check if tournament is complete
    if (roundIndex === newBracket.length - 1 && match.completed) {
      if (tournamentId) {
        await updateTournamentStatus(tournamentId, 'completed', roundIndex, winner);
      }
    }
  };

  // Reset tournament
  const resetTournament = (): void => {
    setIsSetupComplete(false);
    setBracket([]);
    setCurrentRound(0);
    setTournamentId(null);
    setTournamentName('');
    window.history.pushState({}, '', window.location.pathname);
  };

  // Load tournament history
  const loadTournamentHistory = async (): Promise<void> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTournaments(data || []);
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Failed to load tournament history.');
    } finally {
      setLoading(false);
    }
  };

  // Share tournament
  const shareTournament = (): void => {
    if (tournamentId) {
      const url = `${window.location.origin}${window.location.pathname}?tournament=${tournamentId}`;
      navigator.clipboard.writeText(url);
      setShowShareModal(true);
      setTimeout(() => setShowShareModal(false), 3000);
    }
  };

  // Get round name
  const getRoundName = (roundIndex: number, totalRounds: number): string => {
    if (roundIndex === totalRounds - 1) return 'Final';
    if (roundIndex === totalRounds - 2) return 'Semi-Final';
    if (roundIndex === totalRounds - 3) return 'Quarter-Final';
    return `Round ${roundIndex + 1}`;
  };

  // Check if tournament is complete
  const isTournamentComplete = (): boolean => {
    return bracket.length > 0 && bracket[bracket.length - 1][0]?.completed;
  };

  const champion = isTournamentComplete() ? bracket[bracket.length - 1][0].winner : null;

  // Theme Toggle Button Component
  const ThemeToggle: React.FC = () => (
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

  // Loading Spinner
  if (loading) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <Loader2 className={`w-16 h-16 ${theme.text} animate-spin mx-auto mb-4`} />
          <p className={`text-xl ${theme.textSecondary}`}>Loading tournament...</p>
        </div>
      </div>
    );
  }

  // History Modal
  if (showHistory) {
    return (
      <div className={`min-h-screen ${theme.background} p-4 transition-colors duration-300`}>
        <ThemeToggle />
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className={`text-4xl font-bold ${theme.text} mb-4`}>Tournament History</h1>
            <button
              onClick={() => setShowHistory(false)}
              className={`px-6 py-2 bg-gradient-to-r ${theme.buttonSecondary} text-white rounded-xl transition-all shadow-md hover:shadow-lg`}
            >
              Back
            </button>
          </div>

          <div className={`${theme.card} rounded-2xl shadow-xl p-8 border ${theme.cardBorder}`}>
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  onClick={() => {
                    setShowHistory(false);
                    loadTournament(tournament.id);
                  }}
                  className={`${theme.participantBg} p-6 rounded-xl ${theme.participantHover} cursor-pointer transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-xl font-bold ${theme.text} mb-2`}>{tournament.name}</h3>
                      <p className={`${theme.textSecondary} text-sm`}>
                        {new Date(tournament.created_at).toLocaleDateString()} • {tournament.status}
                      </p>
                      {tournament.champion && (
                        <p className={`${theme.textSecondary} text-sm mt-1`}>
                          🏆 Champion: {tournament.champion}
                        </p>
                      )}
                    </div>
                    <ChevronRight className={`w-6 h-6 ${theme.textMuted}`} />
                  </div>
                </div>
              ))}
              {tournaments.length === 0 && (
                <div className={`text-center py-12 ${theme.textMuted}`}>
                  <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No tournament history yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            
            <button
              onClick={loadTournamentHistory}
              className={`mt-4 px-6 py-2 bg-gradient-to-r ${theme.buttonSecondary} text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto`}
            >
              <History className="w-5 h-5" />
              View History
            </button>
          </div>
          
          <div className={`${theme.card} rounded-2xl shadow-xl p-8 mb-6 border ${theme.cardBorder}`}>
            <h2 className={`text-2xl font-semibold ${theme.text} mb-6`}>Tournament Details</h2>
            <input
              type="text"
              value={tournamentName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTournamentName(e.target.value)}
              placeholder="Tournament Name (optional)"
              className={`w-full px-4 py-3 mb-6 ${theme.input} border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
            />

            <h2 className={`text-2xl font-semibold ${theme.text} mb-6`}>Add Participants</h2>
            <div className="flex gap-3 mb-6">
              <input
                type="text"
                value={currentInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addParticipant()}
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
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in">
          <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Link copied to clipboard!
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-bold ${theme.text} mb-2`}>
            {tournamentName || 'Tournament Bracket'}
          </h1>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={resetTournament}
              className={`px-6 py-2 bg-gradient-to-r ${theme.buttonSecondary} text-white rounded-xl transition-all shadow-md hover:shadow-lg`}
            >
              New Tournament
            </button>
            {tournamentId && (
              <button
                onClick={shareTournament}
                className={`px-6 py-2 bg-gradient-to-r ${theme.buttonPrimary} text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2`}
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            )}
            <button
              onClick={loadTournamentHistory}
              className={`px-6 py-2 bg-gradient-to-r ${theme.buttonSecondary} text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2`}
            >
              <History className="w-5 h-5" />
              History
            </button>
          </div>
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
                              onClick={() => !match.completed && match.player1 && selectWinner(roundIndex, matchIndex, match.player1)}
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
                              onClick={() => !match.completed && match.player2 && selectWinner(roundIndex, matchIndex, match.player2)}
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
                