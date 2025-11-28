
export type ActionType =
  | 'APP_INIT'
  | 'MOVE'
  | 'UNDO'
  | 'RESET'
  | 'CHANGE_VIEW_MODE'
  | 'CHANGE_MAIN_VIEW'
  | 'TOGGLE_TARGET_VIEW'
  | 'CHAT_MSG_SENT'
  | 'CHAT_MSG_RECEIVED'
  | 'CHAT_ERROR'
  | 'PUZZLE_SOLVED';

export interface DiagnosticEvent {
  timestamp: number;
  type: ActionType;
  data?: any;
}

class DiagnosticsService {
  private events: DiagnosticEvent[] = [];
  private queue: DiagnosticEvent[] = [];
  private sessionId: string;
  private isRecording: boolean = true;

  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    this.log('APP_INIT', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      screen: { width: window.screen.width, height: window.screen.height }
    });

    if (typeof window !== 'undefined') {
      (window as any).downloadSessionLogs = () => this.download();
      (window as any).getSessionLogs = () => this.events;

      // Flush logs every 5 seconds to the backend
      window.setInterval(() => this.flush(), 5000);

      // Flush on visibility change (tab switch/close) to ensure data is sent
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true);
        }
      });
    }
  }

  setRecording(enabled: boolean) {
    this.isRecording = enabled;
    if (!enabled) {
      this.queue = []; // Clear any pending logs if recording is disabled (e.g. entering replay mode)
    }
  }

  log(type: ActionType, data?: any) {
    if (!this.isRecording) return;

    const event: DiagnosticEvent = {
      timestamp: Date.now(),
      type,
      data
    };
    this.events.push(event);
    this.queue.push(event);
    // console.log(`[Diagnostics] ${type}`, data || '');
  }

  async flush(useBeacon = false) {
    if (this.queue.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      events: this.queue
    };

    // Clear queue immediately to prevent duplicates
    this.queue = [];

    const body = JSON.stringify(payload);

    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/diagnostics', blob);
    } else {
      try {
        await fetch('/api/diagnostics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body
        });
      } catch (err) {
        console.error('Failed to send diagnostics:', err);
      }
    }
  }

  download() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.events, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `knight_swap_session_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

export const diagnostics = new DiagnosticsService();
