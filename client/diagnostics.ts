
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
  | 'PUZZLE_SOLVED'
  | 'USER_IDENTIFIED'
  | 'UNLOCK_MAP'
  | 'UNLOCK_AI';

export interface DiagnosticEvent {
  timestamp: number;
  type: ActionType;
  data?: any;
}

class DiagnosticsService {
  private sessionId: string;
  private isRecording: boolean = true;

  private userName: string | null = null;
  private storageKey: string;

  constructor() {
    this.sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.storageKey = `knightSwap_logs_${this.sessionId}`;

    // Initialize storage
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([]));
    } catch (e) {
      console.error("Local storage initialization failed", e);
    }

    this.log('APP_INIT', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      screen: { width: window.screen.width, height: window.screen.height }
    });

    if (typeof window !== 'undefined') {
      (window as any).downloadSessionLogs = () => this.download();
      (window as any).getSessionLogs = () => this.getStoredEvents();

      // Flush logs every 10 seconds to the backend
      // Sending full history allows for lower frequency updates
      window.setInterval(() => this.flush(), 10000);

      // Flush on visibility change (tab switch/close)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true);
        }
      });
    }
  }

  private getStoredEvents(): DiagnosticEvent[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  setUserName(name: string) {
    this.userName = name;
    this.log('USER_IDENTIFIED', { name });
  }

  setRecording(enabled: boolean) {
    this.isRecording = enabled;
  }

  log(type: ActionType, data?: any) {
    if (!this.isRecording) return;

    const event: DiagnosticEvent = {
      timestamp: Date.now(),
      type,
      data: { ...data, userName: this.userName }
    };

    // Immediate persistence to LocalStorage
    try {
      const events = this.getStoredEvents();
      events.push(event);
      localStorage.setItem(this.storageKey, JSON.stringify(events));
    } catch (e) {
      console.error("Failed to write to local storage", e);
    }
  }

  async flush(useBeacon = false) {
    if (!this.isRecording) return;


    const events = this.getStoredEvents();
    if (events.length === 0) return;

    const payload = {
      sessionId: this.sessionId,
      userName: this.userName,
      events: events, // Send ALL logs
      timestamp: Date.now()
    };

    const body = JSON.stringify(payload);

    if (useBeacon && navigator.sendBeacon) {
      // Beacon does not return status, so we can't check for 404 easily here.
      // We rely on the periodic fetch to disable serverAvailable if needed.
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/diagnostics', blob);
    } else {
      try {
        const response = await fetch('/api/diagnostics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: body
        });


      } catch (err) {
        // Network errors (like offline) shouldn't disable the server permanently,
        // but persistent 404s will.
        console.error('Failed to send diagnostics:', err);
      }
    }
  }

  download() {
    const events = this.getStoredEvents();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `knight_swap_session_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}

export const diagnostics = new DiagnosticsService();
