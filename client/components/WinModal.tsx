
import React, { useState } from 'react';
import Confetti from './Confetti';

interface WinModalProps {
  moveCount: number;
  score: number;
  userName: string;
  onReset: () => void;
  isChallengerView?: boolean;
  onAcceptChallenge?: () => void;
}

const WinModal: React.FC<WinModalProps> = ({ 
  moveCount, 
  score, 
  userName, 
  onReset,
  isChallengerView = false,
  onAcceptChallenge 
}) => {
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleShare = async () => {
    // Construct the share text and URL with challenge params
    const baseUrl = window.location.origin + window.location.pathname;
    const challengeUrl = `${baseUrl}?challenger=${encodeURIComponent(userName)}&score=${score}&moves=${moveCount}`;
    
    const shareText = `I solved the Knight Swap Puzzle in ${moveCount} moves with a Score of ${score}/100! 🚀\n\nCan you beat my score, ${userName}?`;

    try {
        if (navigator.share) {
            const shareData: ShareData = {
                title: 'Knight Swap Challenge',
                text: shareText, 
                url: challengeUrl
            };
            await navigator.share(shareData);
        } else {
            // Fallback for desktop / unsupported browsers
            await navigator.clipboard.writeText(`${shareText}\n${challengeUrl}`);
            setShareState('copied');
            setTimeout(() => setShareState('idle'), 2000);
        }
    } catch (err: any) {
        if (err.name === 'AbortError' || err.message?.toLowerCase().includes('canceled') || err.message?.toLowerCase().includes('cancelled')) {
             return;
        }
        
        console.error("Sharing failed:", err);
        setShareState('error');
        setTimeout(() => setShareState('idle'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <Confetti />
      
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="w-[800px] h-[800px] bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="w-full max-w-xs sm:max-w-sm relative z-10 flex flex-col gap-6 animate-scale-up">
        
        {/* CERTIFICATE CARD */}
        <div className="bg-white p-8 pb-10 rounded-xl shadow-2xl text-center relative overflow-hidden">
            {/* Top color bar */}
            <div className="absolute top-0 left-0 w-full h-3 bg-cyan-500"></div>

            <div className="mt-4">
                <h2 className="text-4xl font-black text-gray-900 leading-none mb-2">
                    {isChallengerView ? "CHALLENGE" : "SOLVED!"}
                </h2>
                <div className="w-12 h-1 bg-amber-400 mx-auto rounded-full mb-4"></div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Knight Swap Challenge</p>
            </div>

            <div className="my-6">
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
                    {isChallengerView ? "Challenger" : "Presented To"}
                </p>
                <p className="text-2xl font-bold text-gray-800">{userName}</p>
            </div>

            <div className="my-8 flex items-center justify-center gap-8">
                <div className="text-center">
                    <span className="block text-4xl font-black text-gray-800 leading-none">
                        {moveCount}<span className="text-xl text-gray-400">/40</span>
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Moves</span>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div className="text-center">
                    <span className="block text-4xl font-black text-amber-500 leading-none whitespace-nowrap">
                        {score}<span className="text-xl text-gray-400">/100</span>
                    </span>
                    <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Score</span>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                 <p className="text-gray-500 text-sm font-medium italic">
                    {isChallengerView ? "Can you beat this score?" : "\"Puzzle Master\""}
                 </p>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col gap-3 w-full">
            {isChallengerView ? (
                <button
                    onClick={onAcceptChallenge}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-amber-900/20"
                >
                    Accept Challenge
                </button>
            ) : (
                <>
                    <button
                        onClick={handleShare}
                        className={`w-full bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-bold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg ${shareState === 'error' ? 'border-red-400 bg-red-50 text-red-600' : ''}`}
                    >
                        {shareState === 'copied' ? (
                            <span className="text-green-600 font-bold">✓ Link Copied!</span>
                        ) : shareState === 'error' ? (
                            <span className="font-bold">Try Again</span>
                        ) : (
                            <>
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                Challenge Others
                            </>
                        )}
                    </button>
                    <button
                        onClick={onReset}
                        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-cyan-900/20"
                    >
                        Play Again
                    </button>
                </>
            )}
        </div>
      </div>
      <style>{`
        @keyframes scale-up {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up {
          animation: scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default WinModal;
