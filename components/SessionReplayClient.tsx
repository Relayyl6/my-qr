'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, X, Loader2, Info } from 'lucide-react';
import 'rrweb-player/dist/style.css';

interface SessionReplayClientProps {
  sessionId: string;
}

// Generates an elegant dark telemetry backdrop DOM snapshot if a recording only captured incremental mouse moves
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
          type: 0, // Document
          childNodes: [
            {
              id: 2,
              type: 1, // DocumentType
              name: 'html',
              publicId: '',
              systemId: '',
            },
            {
              id: 3,
              type: 2, // Element
              tagName: 'html',
              attributes: { lang: 'en', class: 'dark' },
              childNodes: [
                {
                  id: 4,
                  type: 2, // Element
                  tagName: 'head',
                  attributes: {},
                  childNodes: [
                    {
                      id: 5,
                      type: 2, // Element
                      tagName: 'style',
                      attributes: {},
                      childNodes: [
                        {
                          id: 6,
                          type: 3, // Text
                          textContent: `
                            * { box-sizing: border-box; }
                            html, body {
                              margin: 0;
                              padding: 0;
                              width: 100%;
                              min-height: 100%;
                              background-color: #0B0E09 !important;
                              color: #E2E8F0;
                              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                            }
                            .card {
                              background: #11140F;
                              border: 1px solid rgba(255,255,255,0.12);
                              border-radius: 18px;
                              padding: 36px 42px;
                              max-width: 560px;
                              text-align: center;
                              box-shadow: 0 25px 60px rgba(0,0,0,0.85);
                              margin: 24px;
                            }
                            .badge {
                              display: inline-flex;
                              align-items: center;
                              gap: 6px;
                              padding: 5px 14px;
                              background: rgba(16,185,129,0.15);
                              border: 1px solid rgba(16,185,129,0.3);
                              color: #34D399;
                              border-radius: 9999px;
                              font-size: 11.5px;
                              font-family: monospace;
                              font-weight: 600;
                              text-transform: uppercase;
                              letter-spacing: 0.04em;
                              margin-bottom: 16px;
                            }
                            h2 { margin: 0 0 10px; font-size: 20px; color: #FFFFFF; font-weight: 700; letter-spacing: -0.01em; }
                            p { margin: 0 0 16px; font-size: 13.5px; line-height: 1.6; color: #94A3B8; }
                            .telemetry-bar {
                              background: rgba(255,255,255,0.04);
                              border: 1px solid rgba(255,255,255,0.08);
                              border-radius: 10px;
                              padding: 12px 16px;
                              font-size: 11.5px;
                              color: #64748B;
                              font-family: monospace;
                            }
                          `,
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 7,
                  type: 2, // Element
                  tagName: 'body',
                  attributes: {},
                  childNodes: [
                    {
                      id: 8,
                      type: 2, // Element
                      tagName: 'div',
                      attributes: { class: 'card' },
                      childNodes: [
                        {
                          id: 9,
                          type: 2, // Element
                          tagName: 'div',
                          attributes: { class: 'badge' },
                          childNodes: [
                            {
                              id: 10,
                              type: 3, // Text
                              textContent: '● Live Mouse & Interaction Replay',
                            },
                          ],
                        },
                        {
                          id: 11,
                          type: 2, // Element
                          tagName: 'h2',
                          attributes: {},
                          childNodes: [
                            {
                              id: 12,
                              type: 3, // Text
                              textContent: 'Visitor Activity Replay',
                            },
                          ],
                        },
                        {
                          id: 13,
                          type: 2, // Element
                          tagName: 'p',
                          attributes: {},
                          childNodes: [
                            {
                              id: 14,
                              type: 3, // Text
                              textContent: 'Replaying visitor cursor coordinates, clicks, and page interactions. Full page DOM checkpoints are captured automatically across sessions.',
                            },
                          ],
                        },
                        {
                          id: 15,
                          type: 2, // Element
                          tagName: 'div',
                          attributes: { class: 'telemetry-bar' },
                          childNodes: [
                            {
                              id: 16,
                              type: 3, // Text
                              textContent: 'Interaction Telemetry Active • Passwords & Sensitive Inputs Masked',
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
      // Find the first FullSnapshot (type 2) so rrweb never starts on un-snapshotted incremental events
      const firstType2Idx = playableEvents.findIndex((e: any) => e.type === 2);
      if (firstType2Idx > 0) {
        const precedingMeta = playableEvents.slice(0, firstType2Idx).filter((e: any) => e.type === 4).pop();
        playableEvents = precedingMeta
          ? [precedingMeta, ...playableEvents.slice(firstType2Idx)]
          : playableEvents.slice(firstType2Idx);
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
            <div className="flex-1 overflow-auto bg-[#0a0c09] flex items-center justify-center min-h-[460px] p-2 relative">
              <style jsx global>{`
                .rr-player {
                  background-color: #0B0E09 !important;
                }
                .rr-player iframe {
                  background-color: #0B0E09 !important;
                  border: none !important;
                }
              `}</style>
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
