

export interface WalkthroughStep {
  title: string;
  content: string;
  targetSelector?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const walkthroughSteps: WalkthroughStep[] = [
  {
    title: 'Welcome to the Knight Swap!',
    content: "Let's take a quick tour of the puzzle.",
    placement: 'center',
  },
  {
    title: 'The Goal',
    content: 'Your objective is to swap the positions of the white (♘) and black (♞) knights.',
    targetSelector: '[data-walkthrough="board-container"]',
    placement: 'top',
  },
  {
    title: 'How to Move',
    content: 'First, click a knight to select it. Then, click on one of the highlighted green dots to move it to an empty square.',
    targetSelector: '[data-walkthrough="board-container"]',
    placement: 'bottom',
  },
  {
    title: 'Move Counter',
    content: 'This counter tracks how many moves you\'ve made.',
    targetSelector: '[data-walkthrough="move-counter"]',
    placement: 'bottom',
  },
  {
    title: 'Game Controls',
    content: 'You can undo your last move or reset the puzzle back to the start.',
    targetSelector: '[data-walkthrough="controls-buttons"]',
    placement: 'bottom',
  },
  {
    title: 'View Target',
    content: 'Feeling stuck? Use this switch to see what the final board should look like.',
    targetSelector: '[data-walkthrough="view-target"]',
    placement: 'bottom',
  },
  {
    title: 'Unlock a New Perspective',
    content: 'After 30 moves, you can unlock "Map View" to reveal the puzzle\'s hidden linear structure. It might provide the breakthrough you need!',
    targetSelector: '[data-walkthrough="view-switcher"]',
    placement: 'bottom',
  },
  {
    title: 'Unlock AI Helper',
    content: 'Struggling? The AI Helper will also unlock after 30 moves to offer hints without giving away the answer.',
    targetSelector: '[data-walkthrough="ai-helper-tab"]',
    placement: 'top',
  },
  {
    title: 'You\'re All Set!',
    content: 'That\'s everything you need to know. Good luck, and have fun!',
    placement: 'center',
  },
];