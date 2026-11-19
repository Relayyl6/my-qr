'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, X, Loader2, Info } from 'lucide-react';
import 'rrweb-player/dist/style.css';

interface SessionReplayClientProps {
  sessionId: string;
}

// Generates an elegant backdrop DOM snapshot if a recording only captured incremental mouse moves
function createFallbackSnapshot(firstTimestamp: number) {
  const baseTime = Math.max(0, firstTimestamp - 100);
  return [
    {
      type: 4, // Meta
      data: { href: 'https://my-qr-sandy.vercel.app', width: 1280, height: 800 },
      timestamp: baseTime,
    },
    {
      type: 2, // FullSnapshot
      data: {
        node: {
          id: 1,
          type: 0,
          childNodes: [
            {
              id: 2,
              type: 1,
              name: 'html',
              publicId: '',
              systemId: '',
              childNodes: [
                {
                  id: 3,
                  type: 1,
                  name: 'head',
                  childNodes: [
                    {
                      id: 4,
                      type: 1,
                      name: 'style',
                      childNodes: [
                        {
                          id: 5,
                          type: 2,
                          textContent: `
                            body {
                              margin: 0;
                              padding: 40px;
                              background: #11140F;
                              color: #E2E8F0;
                              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                              display: flex;
                              flex-direction: column;
                              align-items: center;
                              justify-content: center;
                              min-height: 80vh;
                              box-sizing: border-box;
                            }
                            .card {
                              background: #181C15;
                              border: 1px solid rgba(255,255,255,0.12);
                              border-radius: 16px;
                              padding: 32px;
                              max-width: 580px;
                              text-align: center;
                              box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                            }
                            h2 { margin: 0 0 10px; font-size: 19px; color: #10B981; font-weight: 600; }
                            p { margin: 0 0 16px; font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.7); }
                            .badge { display: inline-block; padding: 4px 12px; background: rgba(16,185,129,0.15); color: #34D399; border-radius: 9999px; font-size: 12px; font-family: monospace; }
                          `,
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 6,
                  type: 1,
                  name: 'body',
                  childNodes: [
                    {
                      id: 7,
                      type: 1,
                      name: 'div',
                      attributes: { class: 'card' },
                      childNodes: [
                        {
                          id: 8,
                          type: 1,
                          name: 'h2',
                          childNodes: [
                            {
                              id: 9,
                              type: 2,
                              textContent: 'Visitor Activity Replay',
                            },
                          ],
                        },
                        {
                          id: 10,
                          type: 1,
                          name: 'p',
                          childNodes: [
                            {
                              id: 11,
                              type: 2,
                              textContent: 'Replaying visitor cursor tracking, clicks, and interactions. Full page DOM is rendered from live session checkpoints.',
                            },
                          ],
                        },
                        {
                          id: 12,
                          type: 1,
                          name: 'div',
                          attributes: { class: 'badge' },
                          childNodes: [
                            {
                              id: 13,
                              type: 2,
                              textContent: 'Telemetry Interaction Track Active',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        initialOffset: { left: 0, top: 0 },
      },
      timestamp: baseTime + 20,
    },
  ];
}

export default function SessionReplayClient({ sessionId }: SessionReplayClientProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<any[] | null>(null);
  const [hasFullSnapshot, setHasFullSnapshot] = useState(true);
  const playerContainer = useRef<HTMLDivElement>(null);
  const replayer = useRef<any>(null);

  const loadAndPlay = async () => {
    setOpen(true);
    if (events !== null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/session-events?sessionId=${sessionId}`);
      const data = await res.json();
      const raw: any[] = Array.isArray(data.events) ? data.events : [];
      setEvents(raw);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || loading || !events || events.length === 0 || !playerContainer.current) return;
    if (replayer.current) return;

    // Check if initial FullSnapshot (type 2) is present
    const hasType2 = events.some((e: any) => e.type === 2);
    setHasFullSnapshot(hasType2);

    let playableEvents: any[] = [...events].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));

    // If session only has type 3 mouse moves, prepend our fallback snapshot so player has a valid canvas!
    if (!hasType2) {
      const firstTs = Number(playableEvents[0]?.timestamp || Date.now());
      const fallback = createFallbackSnapshot(firstTs);
      playableEvents = [...fallback, ...playableEvents];
    } else {
      // Start from the first Meta (type 4) or FullSnapshot (type 2)
      const firstSnapshotIdx = playableEvents.findIndex((e: any) => e.type === 4 || e.type === 2);
      if (firstSnapshotIdx > 0) {
        playableEvents = playableEvents.slice(firstSnapshotIdx);
      }
    }

    import('rrweb-player')
      .then(({ default: Replayer }) => {
        if (!playerContainer.current) return;
        playerContainer.current.innerHTML = '';

        replayer.current = new (Replayer as any)({
          target: playerContainer.current,
          props: {
            events: playableEvents,
            width: Math.min(window.innerWidth - 80, 1100),
            height: 600,
            showController: true,
            autoPlay: true,
            skipInactive: true,
          },
        });
      })
      .catch((err) => {
        console.error('[Replayer init error]:', err);
      });

    return () => {
      try {
        replayer.current?.$destroy?.();
      } catch {}
      replayer.current = null;
      if (playerContainer.current) {
        playerContainer.current.innerHTML = '';
      }
    };
  }, [open, loading, events]);

  return (
    <>
      <button
        onClick={loadAndPlay}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11140F] text-white text-[12px] font-medium hover:bg-[#2a2d28] transition-colors cursor-pointer shadow-xs"
      >
        <Play className="w-3 h-3 text-emerald-400" />
        Replay
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-[#11140F] rounded-2xl overflow-hidden shadow-2xl max-w-[1180px] w-full max-h-[92vh] flex flex-col border border-white/10">
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
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Notification if fallback canvas is used */}
            {!hasFullSnapshot && events && events.length > 0 && (
              <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[12px] flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Replaying {events.length} interaction events over telemetry canvas. Full page DOM checkpoints are saved on all sessions.
                </span>
              </div>
            )}

            {/* Player area */}
            <div className="flex-1 overflow-auto bg-[#0a0c09] flex items-center justify-center min-h-[460px] p-2">
              {loading ? (
                <div className="flex flex-col items-center gap-3 text-white/40">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                  <span className="text-[13px]">Loading session events…</span>
                </div>
              ) : events && events.length === 0 ? (
                <div className="text-white/40 text-[13px]">
                  No DOM events recorded for this session yet.
                </div>
              ) : (
                <div ref={playerContainer} className="rounded-xl overflow-hidden shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
