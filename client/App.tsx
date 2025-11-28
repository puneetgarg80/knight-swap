
import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { type BoardState, type SquareName, type PieceType, SQUARE_NAMES, type ChatMessage } from './types';
import { INITIAL_BOARD_STATE, TARGET_BOARD_STATE, LEGAL_MOVES } from './constants';
import Board from './components/Board';
import Controls from './components/Controls';
import WinModal from './components/WinModal';
import InvestigationBoard from './components/InvestigationBoard';
import UnlockModal from './components/UnlockModal';
import NameModal from './components/NameModal';
import { walkthroughSteps } from './walkthroughSteps';
import { diagnostics, DiagnosticEvent } from './diagnostics';
import ReplayControls from './components/ReplayControls';

const Chat = lazy(() => import('./components/Chat.tsx'));
const Walkthrough = lazy(() => import('./components/Walkthrough'));

type View = 'board' | 'map';
type MainView = 'puzzle' | 'chat';

const App: React.FC = () => {
  // Solved Stats Persistence
  const [solvedStats, setSolvedStats] = useState<{ moves: number, score: number } | null>(() => {
    try {
      const stored = localStorage.getItem('knightSwapSolvedStats');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Regular State
  const [history, setHistory] = useState<BoardState[]>([INITIAL_BOARD_STATE]);
  const [selectedSquare, setSelectedSquare] = useState<SquareName | null>(null);
  const [isSolved, setIsSolved] = useState<boolean>(!!solvedStats);
  const [shake, setShake] = useState<boolean>(false);
  const [view, setView] = useState<View>('board');
  const [isShowingTarget, setIsShowingTarget] = useState(false);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [mainView, setMainView] = useState<MainView>('puzzle');
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // User State
  const [userName, setUserName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [challengeInfo, setChallengeInfo] = useState<{ name: string, score: string, moves: string } | null>(null);
  const [showChallengerModal, setShowChallengerModal] = useState(false);

  // Points / Unlock State
  const [mapUnlocked, setMapUnlocked] = useState(() => {
    try { return localStorage.getItem('knightSwapMapUnlocked') === 'true'; } catch { return false; }
  });
  const [aiUnlocked, setAiUnlocked] = useState(() => {
    try { return localStorage.getItem('knightSwapAiUnlocked') === 'true'; } catch { return false; }
  });
  const [unlockModalConfig, setUnlockModalConfig] = useState<{ feature: string, cost: number, onConfirm: () => void } | null>(null);


  // Diagnostics / Replay State
  const [isDiagnosticsMode, setIsDiagnosticsMode] = useState(false);
  const [replayLogs, setReplayLogs] = useState<DiagnosticEvent[]>([]);
  const [replayIndex, setReplayIndex] = useState(-1); // -1 means initial state before any logs
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'diagnostics') {
      setIsDiagnosticsMode(true);
      setShowWalkthrough(false); // No walkthrough in diagnostics
      diagnostics.setRecording(false); // Disable recording in diagnostics mode
      return;
    }

    // Check for Challenge Params
    const challengerName = params.get('challenger');
    const challengerScore = params.get('score');
    const challengerMoves = params.get('moves');

    if (challengerName && challengerScore) {
      setChallengeInfo({
        name: challengerName,
        score: challengerScore,
        moves: challengerMoves || '0'
      });
      setShowChallengerModal(true);
    }

    // Load User Name
    try {
      const storedName = localStorage.getItem('knightSwapUserName');
      if (storedName) {
        setUserName(storedName);
        diagnostics.setUserName(storedName);
      } else {
        setShowNameModal(true);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
  }, []);

  // Auto-play logic
  useEffect(() => {
    let interval: any;
    if (isReplayPlaying && isDiagnosticsMode && replayIndex < replayLogs.length - 1) {
      interval = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= replayLogs.length - 1) {
            setIsReplayPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReplayPlaying, replayIndex, replayLogs.length, isDiagnosticsMode]);

  // --- Replay State Derivation ---
  const replayState = useMemo(() => {
    if (!isDiagnosticsMode) return null;

    let rHistory: BoardState[] = [INITIAL_BOARD_STATE];
    let rView: View = 'board';
    let rMainView: MainView = 'puzzle';
    let rMessages: ChatMessage[] = [];
    let rIsShowingTarget = false;
    let rTotalAttempts = 0;
    let rIsSolved = false;

    // Iterate up to the current replay index
    for (let i = 0; i <= replayIndex; i++) {
      const event = replayLogs[i];
      if (!event) break;

      switch (event.type) {
        case 'MOVE':
          const currentBoard = rHistory[rHistory.length - 1];
          const { from, to, piece } = event.data;
          const newBoard = { ...currentBoard };
          newBoard[from] = null;
          newBoard[to] = piece;
          rHistory.push(newBoard);
          rTotalAttempts++;

          // Check win condition in replay
          const solved = SQUARE_NAMES.every(sq => newBoard[sq] === TARGET_BOARD_STATE[sq]);
          if (solved) rIsSolved = true;
          else rIsSolved = false;
          break;
        case 'UNDO':
          if (rHistory.length > 1) rHistory.pop();
          // Re-evaluate solved state after undo if needed, but simplistic is fine
          const lastBoard = rHistory[rHistory.length - 1];
          rIsSolved = SQUARE_NAMES.every(sq => lastBoard[sq] === TARGET_BOARD_STATE[sq]);
          break;
        case 'RESET':
          rHistory = [INITIAL_BOARD_STATE];
          rIsShowingTarget = false;
          rIsSolved = false;
          break;
        case 'CHANGE_VIEW_MODE':
          rView = event.data.view;
          break;
        case 'CHANGE_MAIN_VIEW':
          rMainView = event.data.view;
          break;
        case 'TOGGLE_TARGET_VIEW':
          rIsShowingTarget = event.data.showing;
          break;
        case 'CHAT_MSG_SENT':
          rMessages.push({ role: 'user', text: event.data.text });
          break;
        case 'CHAT_MSG_RECEIVED':
          rMessages.push({ role: 'model', text: event.data.text });
          break;
        case 'CHAT_ERROR':
          rMessages.push({ role: 'model', text: event.data.error });
          break;
        case 'PUZZLE_SOLVED':
          rIsSolved = true;
          break;
      }
    }

    return {
      history: rHistory,
      view: rView,
      mainView: rMainView,
      messages: rMessages,
      isShowingTarget: rIsShowingTarget,
      totalAttempts: rTotalAttempts,
      isSolved: rIsSolved
    };
  }, [isDiagnosticsMode, replayLogs, replayIndex]);

  // --- Effective State (Live vs Replay) ---
  const activeHistory = isDiagnosticsMode && replayState ? replayState.history : history;
  const activeView = isDiagnosticsMode && replayState ? replayState.view : view;
  const activeMainView = isDiagnosticsMode && replayState ? replayState.mainView : mainView;
  const activeIsShowingTarget = isDiagnosticsMode && replayState ? replayState.isShowingTarget : isShowingTarget;
  const activeTotalAttempts = isDiagnosticsMode && replayState ? replayState.totalAttempts : totalAttempts;
  const activeIsSolved = isDiagnosticsMode && replayState ? replayState.isSolved : isSolved;

  const currentBoard = activeHistory[activeHistory.length - 1];
  const moveCount = activeHistory.length - 1;

  // --- Score Calculation ---
  const currentScore = useMemo(() => {
    let score = 100;
    if (mapUnlocked) score -= 20;
    if (aiUnlocked) score -= 20;

    // Penalty only kicks in if moves > 40
    const movePenalty = Math.max(0, (activeTotalAttempts - 40) * 2);
    score -= movePenalty;

    return score;
  }, [activeTotalAttempts, mapUnlocked, aiUnlocked]);

  useEffect(() => {
    if (isDiagnosticsMode || showNameModal || showChallengerModal || activeIsSolved) return;
    try {
      const hasSeenWalkthrough = localStorage.getItem('knightSwapWalkthroughSeen');
      if (!hasSeenWalkthrough) {
        setShowWalkthrough(true);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
  }, [isDiagnosticsMode, showNameModal, showChallengerModal, activeIsSolved]);

  const handleFinishWalkthrough = useCallback(() => {
    try {
      localStorage.setItem('knightSwapWalkthroughSeen', 'true');
    } catch (error) {
      console.error("Could not write to localStorage:", error);
    }
    setShowWalkthrough(false);
  }, []);

  const handleNameSubmit = (name: string) => {
    setUserName(name);
    localStorage.setItem('knightSwapUserName', name);
    diagnostics.setUserName(name);
    setShowNameModal(false);
  };

  const possibleMoves = useMemo((): SquareName[] => {
    if (!selectedSquare) {
      return [];
    }
    return (LEGAL_MOVES[selectedSquare] || []).filter(
      (targetSquare) => currentBoard[targetSquare] === null
    );
  }, [selectedSquare, currentBoard]);


  const checkWinCondition = useCallback((board: BoardState, currentMoveCount: number) => {
    const solved = SQUARE_NAMES.every(square => board[square] === TARGET_BOARD_STATE[square]);
    if (solved) {
      setIsSolved(true);

      const stats = { moves: currentMoveCount, score: currentScore };
      setSolvedStats(stats);
      localStorage.setItem('knightSwapSolvedStats', JSON.stringify(stats));

      diagnostics.log('PUZZLE_SOLVED', { totalMoves: currentMoveCount, finalScore: currentScore });
    }
  }, [currentScore]);

  const handleSquareClick = useCallback((squareName: SquareName) => {
    if (activeIsSolved || isDiagnosticsMode) return;

    if (selectedSquare) {
      const pieceToMove = currentBoard[selectedSquare] as PieceType;
      const isValidMove = LEGAL_MOVES[selectedSquare]?.includes(squareName);
      const isTargetEmpty = currentBoard[squareName] === null;

      if (isValidMove && isTargetEmpty) {
        diagnostics.log('MOVE', {
          from: selectedSquare,
          to: squareName,
          piece: pieceToMove,
          moveNumber: activeHistory.length
        });

        const newBoardState = { ...currentBoard };
        newBoardState[squareName] = pieceToMove;
        newBoardState[selectedSquare] = null;

        const newHistory = [...activeHistory, newBoardState];
        setHistory(newHistory);
        setTotalAttempts(prev => prev + 1);
        checkWinCondition(newBoardState, newHistory.length - 1);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 300);
      }
      setSelectedSquare(null);
    } else {
      if (currentBoard[squareName]) {
        setSelectedSquare(squareName);
      }
    }
  }, [selectedSquare, currentBoard, activeHistory, activeIsSolved, checkWinCondition, isDiagnosticsMode]);

  const handleReset = useCallback(() => {
    if (isDiagnosticsMode) return;
    diagnostics.log('RESET');
    setHistory([INITIAL_BOARD_STATE]);
    setTotalAttempts(0);
    setSelectedSquare(null);
    setIsSolved(false);
    setIsShowingTarget(false);

    // Clear solved state
    setSolvedStats(null);
    localStorage.removeItem('knightSwapSolvedStats');
  }, [isDiagnosticsMode]);

  const handleUndo = useCallback(() => {
    if (isDiagnosticsMode) return;
    if (activeHistory.length > 1) {
      diagnostics.log('UNDO', { moveCountBeforeUndo: activeHistory.length - 1 });
      setHistory(activeHistory.slice(0, -1));
      setTotalAttempts(prev => Math.max(0, prev - 1));
      setSelectedSquare(null);
      if (activeIsSolved) setIsSolved(false);
    }
  }, [activeHistory, activeIsSolved, isDiagnosticsMode]);

  // Feature Unlock Logic
  const requestUnlockMap = () => {
    setUnlockModalConfig({
      feature: "Map View",
      cost: 20,
      onConfirm: () => {
        setMapUnlocked(true);
        localStorage.setItem('knightSwapMapUnlocked', 'true');
        setView('map');
        setUnlockModalConfig(null);
      }
    });
  };

  const requestUnlockAi = () => {
    setUnlockModalConfig({
      feature: "AI Helper",
      cost: 20,
      onConfirm: () => {
        setAiUnlocked(true);
        localStorage.setItem('knightSwapAiUnlocked', 'true');
        setMainView('chat');
        setUnlockModalConfig(null);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        setReplayLogs(json);
        setReplayIndex(-1);
      } catch (err) {
        alert("Failed to parse JSON log file.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const boardToDisplay = activeIsShowingTarget ? TARGET_BOARD_STATE : currentBoard;
  // In diagnostics mode, disable clicks
  const clickHandler = activeIsShowingTarget || activeIsSolved || showWalkthrough || isDiagnosticsMode ? () => { } : handleSquareClick;

  const BottomNavButton: React.FC<{ view: MainView; label: string; children: React.ReactNode; isLocked?: boolean; onClickLocked?: () => void }> = ({ view, label, children, isLocked, onClickLocked }) => {
    const isActive = activeMainView === view;

    const handleClick = () => {
      if (isDiagnosticsMode) return;
      if (isLocked) {
        onClickLocked?.();
      } else {
        diagnostics.log('CHANGE_MAIN_VIEW', { view });
        setMainView(view);
      }
    };

    return (
      <button
        onClick={handleClick}
        disabled={isDiagnosticsMode}
        className={`relative flex flex-col items-center justify-center gap-1 w-28 h-14 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${isActive ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          } ${isDiagnosticsMode ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        aria-label={isLocked ? `Unlock ${label}` : `Switch to ${label} view`}
      >
        {children}
        <span className="text-xs font-medium tracking-wide flex items-center gap-1">
          {label}
          {isLocked && <span className="text-[10px]">🔒</span>}
        </span>
      </button>
    );
  };

  if (isDiagnosticsMode && replayLogs.length === 0) {
    return (
      <div className="h-[100dvh] bg-gray-900 text-white flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6">Diagnostics Mode</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md text-center">
          <p className="mb-4 text-gray-300">Upload a session log (JSON) to replay user interactions.</p>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-cyan-600 file:text-white
                        hover:file:bg-cyan-500
                    "
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gray-900 text-gray-100 flex flex-col font-sans overflow-hidden relative">
      <Suspense fallback={null}>
        {showWalkthrough && !showNameModal && !showChallengerModal && <Walkthrough onFinish={handleFinishWalkthrough} />}
      </Suspense>

      {showNameModal && <NameModal onNameSubmit={handleNameSubmit} />}

      {/* Challenger Modal (On Load) */}
      {showChallengerModal && challengeInfo && (
        <WinModal
          moveCount={parseInt(challengeInfo.moves)}
          score={parseInt(challengeInfo.score)}
          userName={challengeInfo.name}
          onReset={() => { }}
          isChallengerView={true}
          onAcceptChallenge={() => setShowChallengerModal(false)}
        />
      )}

      {/* Victor Modal (On Win) */}
      {activeIsSolved && !showChallengerModal && (
        <WinModal
          moveCount={solvedStats ? solvedStats.moves : moveCount}
          score={solvedStats ? solvedStats.score : currentScore}
          userName={userName}
          onReset={handleReset}
        />
      )}

      {unlockModalConfig && (
        <UnlockModal
          featureName={unlockModalConfig.feature}
          cost={unlockModalConfig.cost}
          currentScore={currentScore}
          onConfirm={unlockModalConfig.onConfirm}
          onCancel={() => setUnlockModalConfig(null)}
        />
      )}

      {/* Challenge Banner (After Accepting) */}
      {challengeInfo && !activeIsSolved && !isDiagnosticsMode && !showChallengerModal && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 text-center text-sm font-bold shadow-md z-20 flex justify-between items-center">
          <span>⚔️ Challenge from {challengeInfo.name}: Beat Score {challengeInfo.score}!</span>
          <button
            onClick={() => setChallengeInfo(null)}
            className="ml-4 text-amber-100 hover:text-white focus:outline-none"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-grow overflow-y-auto">
        {/* Puzzle View */}
        <div className={`${activeMainView === 'puzzle' ? 'flex' : 'hidden'} flex-col items-center p-4 min-h-full`}>
          <header className="w-full text-center mb-2">
            <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 mb-2">
              {isDiagnosticsMode ? "Replay Mode" : "The Knight Swap Puzzle"}
            </h1>
            <p className="text-gray-300">
              {isDiagnosticsMode ? "Replaying recorded session..." : "Swap the positions of the white (♘) and black (♞) knights."}
            </p>
          </header>

          <main className="w-full flex flex-col items-center justify-center gap-2 max-w-[85vmin] md:max-w-2xl mb-2">
            <Controls
              moveCount={moveCount}
              score={currentScore}
              onReset={handleReset}
              onUndo={handleUndo}
              canUndo={activeHistory.length > 1 && !activeIsSolved && !isDiagnosticsMode}
              currentView={activeView}
              onViewChange={(newView) => {
                if (isDiagnosticsMode) return;
                diagnostics.log('CHANGE_VIEW_MODE', { view: newView });
                setView(newView);
              }}
              isShowingTarget={activeIsShowingTarget}
              onToggleTarget={() => {
                if (isDiagnosticsMode) return;
                const newVal = !isShowingTarget;
                diagnostics.log('TOGGLE_TARGET_VIEW', { showing: newVal });
                setIsShowingTarget(newVal);
              }}
              isMapUnlocked={mapUnlocked}
              onRequestUnlockMap={requestUnlockMap}
            />
            <div data-walkthrough="board-container" className={`relative w-full transition-all duration-300 ${activeIsShowingTarget ? 'ring-2 ring-amber-400 rounded-lg shadow-lg' : ''}`}>
              {activeIsShowingTarget && <p className="absolute -top-6 left-0 right-0 text-center text-amber-400 text-sm font-semibold">TARGET STATE (VIEW-ONLY)</p>}
              {activeView === 'board' ? (
                <Board
                  boardState={boardToDisplay}
                  onSquareClick={clickHandler}
                  selectedSquare={activeIsShowingTarget ? null : selectedSquare}
                  possibleMoves={activeIsShowingTarget ? [] : possibleMoves}
                  shake={shake}
                />
              ) : (
                <InvestigationBoard
                  boardState={boardToDisplay}
                  onSquareClick={clickHandler}
                  selectedSquare={activeIsShowingTarget ? null : selectedSquare}
                  possibleMoves={activeIsShowingTarget ? [] : possibleMoves}
                  shake={shake}
                />
              )}
            </div>
          </main>

          <footer className="w-full text-center">
            <div className="bg-gray-800 p-4 rounded-lg text-sm max-w-md mx-auto">
              {activeView === 'map' ? (
                <>
                  <p className="font-semibold mb-2 text-cyan-400">About Map View</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-400 text-left">
                    <li><strong>Graph Transformation:</strong> We converted the board squares into nodes and legal Knight moves into connecting lines.</li>
                    <li><strong>Hidden Structure:</strong> This reveals that the puzzle isn't a complex 2D grid, but a simple linear track with one side-path.</li>
                    <li><strong>Goal:</strong> Treat each knight like a car and connections like streets. Simply drive the cars along the track to swap their positions.</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-2">Rules:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400">
                    <li>Knights move in an 'L' shape (or follow the lines in Map View).</li>
                    <li>A knight can only move to an empty square.</li>
                    <li>Click a knight to select it, then click an empty square to move.</li>
                  </ul>
                </>
              )}
            </div>
          </footer>
        </div>

        {/* Chat View */}
        <div className={`${activeMainView === 'chat' ? 'flex' : 'hidden'} h-full items-center justify-center p-4`}>
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p>Loading AI Helper...</p>
            </div>
          }>
            <Chat replayMessages={isDiagnosticsMode ? replayState?.messages : undefined} />
          </Suspense>
        </div>
      </div>

      {isDiagnosticsMode ? (
        <ReplayControls
          isPlaying={isReplayPlaying}
          onPlayPause={() => setIsReplayPlaying(!isReplayPlaying)}
          onNext={() => setReplayIndex(i => Math.min(i + 1, replayLogs.length - 1))}
          onPrev={() => setReplayIndex(i => Math.max(i - 1, -1))}
          currentIndex={replayIndex}
          totalSteps={replayLogs.length}
          onSeek={(val) => setReplayIndex(val)}
          currentAction={replayIndex >= 0 ? replayLogs[replayIndex].type : 'Start'}
        />
      ) : (
        <nav className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 z-10">
          <div className="flex justify-center items-center gap-4 h-20 max-w-md mx-auto">
            <BottomNavButton view="puzzle" label="Puzzle">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </BottomNavButton>
            <div data-walkthrough="ai-helper-tab">
              <BottomNavButton
                view="chat"
                label="AI Helper"
                isLocked={!aiUnlocked}
                onClickLocked={requestUnlockAi}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </BottomNavButton>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default App;
