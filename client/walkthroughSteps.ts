
export interface WalkthroughStep {
  title: string;
  content: string;
  targetSelector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const walkthroughSteps: WalkthroughStep[] = [
  {
    title: 'Welcome to the Knight Swap!',
    content: "Let's take a quick tour. You start with 100 Points. Your goal is to solve the puzzle efficiently!",
    placement: 'center',
  },
  {
    title: 'The Goal',
    content: 'Your objective is to swap the positions of the white (♘) and black (♞) knights.',
    targetSelector: '[data-walkthrough="board-container"]',
    placement: 'top',
  },
  {
    title: 'Moves & Score',
    content: 'Keep an eye on your Moves. Efficient solving (under 40 moves) protects your score. Excess moves will reduce your score.',
    targetSelector: '[data-walkthrough="moves-score"]',
    placement: 'bottom',
  },
  {
    title: 'View Target',
    content: 'Toggle this switch to see the target state you are aiming for.',
    targetSelector: '[data-walkthrough="view-target-toggle"]',
    placement: 'bottom',
  },
  {
    title: 'Unlock Map View',
    content: 'Stuck? You can unlock the Map View to see the hidden connections. But be warned: it costs 20 Points!',
    targetSelector: '[data-walkthrough="unlock-map-btn"]',
    placement: 'bottom',
  },
  {
    title: 'Unlock AI Helper',
    content: 'Need a hint? You can unlock the AI Helper for 20 Points to guide you through the solution.',
    targetSelector: '[data-walkthrough="chat-section"]',
    placement: 'top',
  },
  {
    title: 'Game Controls',
    content: 'Use Undo to fix mistakes, or Reset to start over (unlocks remain purchased).',
    targetSelector: '[data-walkthrough="controls-buttons"]',
    placement: 'bottom',
  },
  {
    title: 'Good Luck!',
    content: 'Can you solve it with a perfect score? Give it your best shot!',
    placement: 'center',
  },
];
