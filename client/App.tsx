
import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { type BoardState, type SquareName, type PieceType, SQUARE_NAMES, type ChatMessage } from './types';
import { INITIAL_BOARD_STATE, TARGET_BOARD_STATE, LEGAL_MOVES } from './constants';
import Board from './components/Board';
import Controls from './components/Controls';
import WinModal from './components/WinModal';
import RulesModal from './components/RulesModal';
import ViewSwitcher from './components/ViewSwitcher';
import InvestigationBoard from './components/InvestigationBoard';
import UnlockModal from './components/UnlockModal';
import NameModal from './components/NameModal';
import { walkthroughSteps } from './walkthroughSteps';
import { diagnostics, DiagnosticEvent } from './diagnostics';
import ReplayControls from './components/ReplayControls';
import ChatSection from './components/ChatSection';

const Chat = lazy(() => import('./components/Chat.tsx'));
const Walkthrough = lazy(() => import('./components/Walkthrough'));

type View = 'board' | 'map';
// type MainView = 'puzzle' | 'chat'; // Removed

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
  // const [mainView, setMainView] = useState<MainView>('puzzle'); // Removed
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // User State
  const [userName, setUserName] = useState<string>('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [challengeInfo, setChallengeInfo] = useState<{ name: string, score: string, moves: string, certImageUrl?: string } | null>(null);
  const [showChallengerModal, setShowChallengerModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Points / Unlock State
  const [mapUnlocked, setMapUnlocked] = useState(() => {
    try { return localStorage.getItem('knightSwapMapUnlocked') === 'true'; } catch { return false; }
  });
  const [boardChatUnlocked, setBoardChatUnlocked] = useState(() => {
    try { return localStorage.getItem('knightSwapBoardChatUnlocked') === 'true'; } catch { return false; }
  });
  const [mapChatUnlocked, setMapChatUnlocked] = useState(() => {
    try { return localStorage.getItem('knightSwapMapChatUnlocked') === 'true'; } catch { return false; }
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
        moves: challengerMoves || '0',
        certImageUrl: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined
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
    // let rMainView: MainView = 'puzzle'; // Removed
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
        // case 'CHANGE_MAIN_VIEW': // Removed
        //   rMainView = event.data.view;
        //   break;
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
      // mainView: rMainView, // Removed
      messages: rMessages,
      isShowingTarget: rIsShowingTarget,
      totalAttempts: rTotalAttempts,
      isSolved: rIsSolved
    };
  }, [isDiagnosticsMode, replayLogs, replayIndex]);

  // --- Effective State (Live vs Replay) ---
  const activeHistory = isDiagnosticsMode && replayState ? replayState.history : history;
  const activeView = isDiagnosticsMode && replayState ? replayState.view : view;
  // const activeMainView = isDiagnosticsMode && replayState ? replayState.mainView : mainView; // Removed
  const activeIsShowingTarget = isDiagnosticsMode && replayState ? replayState.isShowingTarget : isShowingTarget;
  const activeTotalAttempts = isDiagnosticsMode && replayState ? replayState.totalAttempts : totalAttempts;
  const activeIsSolved = isDiagnosticsMode && replayState ? replayState.isSolved : isSolved;

  const currentBoard = activeHistory[activeHistory.length - 1];
  const moveCount = activeHistory.length - 1;

  // --- Score Calculation ---
  const currentScore = useMemo(() => {
    let score = 100;
    if (mapUnlocked) score -= 20;
    if (mapUnlocked) score -= 20;
    if (boardChatUnlocked) score -= 20;
    if (mapChatUnlocked) score -= 20;

    // Penalty only kicks in if moves > 40
    const movePenalty = Math.max(0, (activeTotalAttempts - 40) * 2);
    score -= movePenalty;

    return score;
  }, [activeTotalAttempts, mapUnlocked, boardChatUnlocked, mapChatUnlocked]);

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

  const requestUnlockAi = (type: 'board' | 'map') => {
    setUnlockModalConfig({
      feature: type === 'board' ? "Board AI Helper" : "Map AI Helper",
      cost: 20,
      onConfirm: () => {
        if (type === 'board') {
          setBoardChatUnlocked(true);
          localStorage.setItem('knightSwapBoardChatUnlocked', 'true');
        } else {
          setMapChatUnlocked(true);
          localStorage.setItem('knightSwapMapChatUnlocked', 'true');
        }
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
        const events = json.events;
        if (!Array.isArray(events)) throw new Error("Invalid log format");
        setReplayLogs(events);
        setReplayIndex(-1);
        setIsDiagnosticsMode(true);
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

  // BottomNavButton Removed

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
          certImageUrl={challengeInfo.certImageUrl}
          onReset={() => { }}
          isChallengerView={true}
          onAcceptChallenge={() => {
            setShowChallengerModal(false);
            // setMainView('puzzle'); // Removed
            setView('board');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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

      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        view={activeView}
      />

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
        <div className={`flex flex-col items-center p-4 min-h-full`}>
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
              onShowRules={() => setShowRulesModal(true)}
            />

            <div className="w-full flex justify-center mb-2" data-walkthrough="view-switcher">
              <ViewSwitcher
                currentView={activeView}
                onViewChange={(newView) => {
                  if (isDiagnosticsMode) return;
                  diagnostics.log('CHANGE_VIEW_MODE', { view: newView });
                  setView(newView);
                }}
                isMapUnlocked={mapUnlocked}
                onUnlockRequest={requestUnlockMap}
              />
            </div>

            <div data-walkthrough="board-container" className={`relative w-full transition-all duration-300 ${activeIsShowingTarget ? 'ring-2 ring-amber-400 rounded-lg shadow-lg' : ''}`}>
              {activeIsShowingTarget && <p className="absolute -top-6 left-0 right-0 text-center text-amber-400 text-sm font-semibold">TARGET STATE (VIEW-ONLY)</p>}
              {activeView === 'board' ? (
                <>
                  <Board
                    boardState={boardToDisplay}
                    onSquareClick={clickHandler}
                    selectedSquare={activeIsShowingTarget ? null : selectedSquare}
                    possibleMoves={activeIsShowingTarget ? [] : possibleMoves}
                    shake={shake}
                  />
                  <ChatSection
                    title="Board AI Helper"
                    isUnlocked={boardChatUnlocked}
                    onUnlock={() => requestUnlockAi('board')}
                    context="board"
                  />
                </>
              ) : (
                <>
                  <InvestigationBoard
                    boardState={boardToDisplay}
                    onSquareClick={clickHandler}
                    selectedSquare={activeIsShowingTarget ? null : selectedSquare}
                    possibleMoves={activeIsShowingTarget ? [] : possibleMoves}
                    shake={shake}
                  />
                  <ChatSection
                    title="Map AI Helper"
                    isUnlocked={mapChatUnlocked}
                    onUnlock={() => requestUnlockAi('map')}
                    initialMessage="How can I help with maps view?"
                    context="map"
                  />
                </>
              )}
            </div>
          </main>

          <footer className="w-full text-center">
            {/* Rules moved to modal */}
          </footer>

          {/* Embedded Chat Section Removed (Integrated above) */}
        </div>

        {/* Chat View Removed */}
      </div>

      {isDiagnosticsMode && (
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
      )}
    </div>
  );
};

export default App;
