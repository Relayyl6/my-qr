'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, X, Loader2 } from 'lucide-react';

interface SessionReplayClientProps {
  sessionId: string;
}

export default function SessionReplayClient({ sessionId }: SessionReplayClientProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<unknown[] | null>(null);
  const playerContainer = useRef<HTMLDivElement>(null);
  const replayer = useRef<unknown>(null);

  const loadAndPlay = async () => {
    setOpen(true);
    if (events !== null) return; // already loaded
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/session-events?sessionId=${sessionId}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || loading || !events || events.length === 0 || !playerContainer.current) return;
    if (replayer.current) return; // already initialised

    // Dynamically import rrweb-player (heavy, only load when modal opens)
    import('rrweb-player').then(({ default: Replayer }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      replayer.current = new (Replayer as any)({
        target: playerContainer.current,
        props: {
          events,
          width: Math.min(window.innerWidth - 80, 1100),
          height: 600,
          showController: true,
          autoPlay: true,
          skipInactive: true,
        },
      });
    }).catch(() => {
      // rrweb-player not available
    });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (replayer.current as any)?.$destroy?.();
      replayer.current = null;
    };
  }, [open, loading, events]);

  // Inject rrweb-player CSS once
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'rrweb-player-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/rrweb-player@2/dist/style.css';
    document.head.appendChild(link);
  }, []);

  return (
    <>
      <button
        onClick={loadAndPlay}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11140F] text-white text-[12px] font-medium hover:bg-[#2a2d28] transition-colors"
      >
        <Play className="w-3 h-3" />
        Replay
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-[#11140F] rounded-2xl overflow-hidden shadow-2xl max-w-[1180px] w-full max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                <span className="text-white text-[13px] font-medium font-mono">
                  Session Replay — {sessionId.slice(0, 8)}…
                </span>
                <span className="text-white/30 text-[11px] font-mono">
                  Passwords masked · GDPR compliant
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Player area */}
            <div className="flex-1 overflow-auto bg-[#0a0c09] flex items-center justify-center min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-white/40">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-[13px]">Loading session events…</span>
                </div>
              ) : events && events.length === 0 ? (
                <div className="text-white/40 text-[13px]">
                  No DOM events recorded for this session yet.
                </div>
              ) : (
                <div ref={playerContainer} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
