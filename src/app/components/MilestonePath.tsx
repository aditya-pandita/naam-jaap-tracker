'use client';

/**
 * @file src/app/components/MilestonePath.tsx
 * @description The Naam Jaap milestone path: a straight track from the start through
 * each Crore milestone (1–13 Cr), each with its own icon, a marker at the practitioner's
 * current total, and a description of the next step below.
 *
 * On narrow screens the track scrolls sideways and opens centred on the marker.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { formatIndianNumber } from '@/lib/date-helpers';

const CRORE = 10_000_000;

interface Milestone {
    crore: number;
    title: string;
    description: string;
    icon: ReactNode;
}

/* ---------- Icons (24×24 line glyphs, drawn with currentColor) ---------- */

const I = {
    drop: (
        <>
            <path d="M12 3c3.5 4.2 6 7.6 6 10.8A6 6 0 0 1 6 13.8C6 10.6 8.5 7.2 12 3z" />
            <path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.5" />
        </>
    ),
    kalash: (
        <>
            <path d="M8 9h8M9 9c-3 1.5-4 4-3.4 6.6C6.3 18.6 9 20 12 20s5.7-1.4 6.4-4.4C19 13 18 10.5 15 9" />
            <path d="M10 9V7h4v2M9 5.5c1-1.5 2-2 3-2s2 .5 3 2" />
            <circle cx="12" cy="14.5" r="1.6" />
        </>
    ),
    heart: (
        <>
            <path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z" />
            <path d="M9.5 10.5l1.7 1.7 3.3-3.4" />
        </>
    ),
    diya: (
        <>
            <path d="M4 14h16c-.8 3.2-4 5-8 5s-7.2-1.8-8-5z" />
            <path d="M12 3.5c1.8 2.2 2.5 3.8 2.5 5.2a2.5 2.5 0 0 1-5 0c0-1.4.7-3 2.5-5.2z" />
            <path d="M12 11.5V14" />
        </>
    ),
    book: (
        <>
            <path d="M12 7c-2-1.5-4.5-2-8-2v12c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2V5c-3.5 0-6 .5-8 2z" />
            <path d="M12 7v12" />
        </>
    ),
    shield: (
        <>
            <path d="M12 3l7 3v5.5c0 4.4-3 7.8-7 9.5-4-1.7-7-5.1-7-9.5V6l7-3z" />
            <path d="M12 8v8M8.5 12h7" />
        </>
    ),
    lotus: (
        <>
            <path d="M12 6c2 2 2.8 4.4 2.8 6.8S13.6 17.2 12 18c-1.6-.8-2.8-2.8-2.8-5.2S10 8 12 6z" />
            <path d="M9.2 10.5C7 9.8 5 10 3.5 11c.6 3.8 4 7 8.5 7M14.8 10.5c2.2-.7 4.2-.5 5.7.5-.6 3.8-4 7-8.5 7" />
            <path d="M4 20.5h16" />
        </>
    ),
    eye: (
        <>
            <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
            <circle cx="12" cy="12" r="2.8" />
        </>
    ),
    vak: (
        <>
            <path d="M5 5h14v10h-7l-4 4v-4H5z" />
            <path d="M12 7.5l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z" />
        </>
    ),
    moksha: (
        <>
            <path d="M17.5 7.5A7 7 0 1 0 19 12" />
            <path d="M14 3h5v5M19 3l-6 6" />
        </>
    ),
    peak: (
        <>
            <path d="M3 20l6.5-11 3.5 5.5 2.5-3.5L21 20z" />
            <path d="M9.5 9V3.5l3.5 1.5-3.5 1.5" />
        </>
    ),
    flute: (
        <>
            <path d="M4 18.5L19 5.5l1.5 1.7L5.5 20.2z" />
            <circle cx="9" cy="15" r=".7" />
            <circle cx="11.6" cy="12.7" r=".7" />
            <circle cx="14.2" cy="10.4" r=".7" />
            <path d="M17 4.5c1-1 2.4-1.2 3 0" />
        </>
    ),
    sun: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
        </>
    ),
    seed: (
        <>
            <circle cx="12" cy="12" r="6.5" />
            <circle cx="12" cy="12" r="2" />
        </>
    ),
};

export const MILESTONES: Milestone[] = [
    {
        crore: 1, title: 'Purified Body', icon: I.drop,
        description: 'The body is cleansed of sins. Rajoguna and Tamoguna fall away and the practitioner rests in pure Sattvaguna. Future karmic seeds of disease are destroyed, and divine visions may come in dreams.',
    },
    {
        crore: 2, title: 'Abundance', icon: I.kalash,
        description: 'Poverty and the craving for material wealth vanish. Peace and abundance arrive, as though prosperity naturally flows toward the practitioner.',
    },
    {
        crore: 3, title: 'Pure Heart', icon: I.heart,
        description: 'The heart becomes perfectly pure. Tasks once thought impossible become easy, and the practitioner is loved by the whole world.',
    },
    {
        crore: 4, title: 'Divine Bliss', icon: I.diya,
        description: 'The heart fills with divine bliss and self-realization (nityatva bodh) dawns. Joy and sorrow, honour and dishonour no longer disturb the practitioner.',
    },
    {
        crore: 5, title: 'Infinite Knowledge', icon: I.book,
        description: 'Infinite knowledge awakens. Whatever is desired is attained; the practitioner masters the scriptures and gains great influence.',
    },
    {
        crore: 6, title: 'Six Enemies Conquered', icon: I.shield,
        description: 'Lust, anger, greed, attachment, pride and jealousy are conquered. Through resolve alone, even incurable diseases can be overcome.',
    },
    {
        crore: 7, title: 'Detachment', icon: I.lotus,
        description: 'Such purity is attained that worldly allurements lose all hold. The practitioner enjoys direct communion with great devotees and saints.',
    },
    {
        crore: 8, title: 'Fearlessness', icon: I.eye,
        description: 'The fear of death vanishes. The practitioner becomes a self-realized soul and attains direct, manifest communion with their chosen deity.',
    },
    {
        crore: 9, title: 'Truthful Speech', icon: I.vak,
        description: 'The practitioner becomes a speaker of truth whose words manifest into reality, and tastes unparalleled divine joy.',
    },
    {
        crore: 10, title: 'Liberation', icon: I.moksha,
        description: 'All accumulated and present karmas are consumed. Liberation is attained and the cycle of birth and death is overcome.',
    },
    {
        crore: 11, title: 'All Goals Fulfilled', icon: I.peak,
        description: 'Every worldly, spiritual and yogic goal is fulfilled.',
    },
    {
        crore: 12, title: 'God Bound by Love', icon: I.flute,
        description: 'The Lord becomes bound to the devotee by their love.',
    },
    {
        crore: 13, title: 'Giver of Liberation', icon: I.sun,
        description: 'The practitioner gains the power to grant liberation to others.',
    },
];

const LAST = MILESTONES[MILESTONES.length - 1].crore;


/* ---------- Layout ---------- */

const STEP = 76;   // px between milestone centres
const PAD = 34;    // px before the start node and after the last node
const DISC_R = 23;   // radius of a milestone disc (size 54 - 4px inset - border)
const TRACK_W = PAD * 2 + LAST * STEP;
const xOf = (crore: number) => PAD + Math.max(0, Math.min(crore, LAST)) * STEP;

const css = `
.mp { margin-bottom: 16px; }
.mp-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 4px; }
.mp-head .card-label { margin-bottom: 0; }
.mp-count { font-size: 11px; font-family: var(--mono); color: var(--text3); }
.mp-scroll { overflow-x: auto; margin: 0 -20px; padding: 0 20px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.mp-scroll::-webkit-scrollbar { display: none; }
.mp-track { position: relative; height: 100px; margin: 0 auto; }
.mp-line, .mp-line-fill { position: absolute; top: 25px; height: 4px; border-radius: 2px; }
.mp-line { background: repeating-linear-gradient(90deg, rgba(255,107,0,0.22) 0 6px, transparent 6px 12px); }
.mp-line-fill { background: linear-gradient(90deg, #E05500, #FF8C35); box-shadow: 0 0 12px rgba(255,107,0,0.55); transition: width 1s cubic-bezier(.4,0,.2,1); }
.mp-node { position: absolute; top: 0; width: 64px; margin-left: -32px; display: flex; flex-direction: column; align-items: center;
  background: none; border: none; padding: 0; cursor: pointer; color: inherit; font: inherit; }
.mp-node svg { display: block; transition: transform .2s; }
.mp-node:hover svg, .mp-node:focus-visible svg { transform: scale(1.08); }
.mp-node:focus-visible { outline: none; }
.mp-node:focus-visible .mp-cr { color: var(--text); }
.mp-cr { margin-top: 6px; font-size: 11px; font-weight: 600; font-family: var(--mono); color: var(--text3); white-space: nowrap; }
.mp-cr.done { color: var(--gold); } .mp-cr.next { color: var(--text); }
.mp-tag { margin-top: 3px; font-size: 8px; font-family: var(--mono); letter-spacing: .08em; color: var(--gold);
  border: 1px solid rgba(255,107,0,0.5); background: rgba(255,107,0,0.14); border-radius: 6px; padding: 1px 5px; }
.mp-disc-locked { fill: #1A0C04; stroke: rgba(255,107,0,0.22); stroke-width: 1.5; }
.mp-disc-next { fill: #241005; stroke: rgba(255,107,0,0.3); stroke-width: 3; }
.mp-disc-done { fill: url(#mp-done); stroke: #FFB27A; stroke-width: 1.5; }
.mp-icon { fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.mp-icon-locked { stroke: #6B4430; } .mp-icon-next { stroke: var(--gold); } .mp-icon-done { stroke: #2A1000; stroke-width: 1.9; }
.mp-arc { fill: none; stroke: var(--gold); stroke-width: 3; stroke-linecap: round; }
.mp-sel { fill: none; stroke: var(--text); stroke-width: 1.5; opacity: .85; }
@media (prefers-reduced-motion: reduce) { .mp-line-fill { transition: none; } }
.mp-detail { display: flex; gap: 14px; align-items: flex-start; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 4px; }
.mp-detail svg { flex: none; }
.mp-kicker { font-size: 10px; font-family: var(--mono); text-transform: uppercase; letter-spacing: .08em; color: var(--gold); }
.mp-title { font-size: 17px; font-weight: 700; color: var(--text); margin-top: 2px; }
.mp-status { font-size: 11px; font-family: var(--mono); color: var(--text3); margin-top: 3px; }
.mp-text { font-size: 14px; line-height: 1.6; color: var(--text2); margin-top: 8px; }
.mp-bar { margin-top: 12px; }
`;

type State = 'done' | 'next' | 'locked';

/** A milestone disc with its icon, drawn centred in a size×size SVG. */
/** `arc` (0–1) draws a progress ring around the disc, used for the next milestone. */
function Disc({ m, state, size, selected = false, arc }: {
    m: Milestone | null; state: State; size: number; selected?: boolean; arc?: number;
}) {
    const r = size / 2 - 4;
    const s = (r * 1.05) / 24;
    return (
        <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} aria-hidden="true">
            {selected && <circle className="mp-sel" r={size / 2 - 1} />}
            <circle className={`mp-disc-${state}`} r={r} />
            {arc !== undefined && arc > 0 && (
                <circle
                    className="mp-arc"
                    r={r}
                    transform="rotate(-90)"
                    strokeDasharray={`${(2 * Math.PI * r * Math.min(arc, 1)).toFixed(2)} 999`}
                />
            )}
            <g className={`mp-icon mp-icon-${state}`} transform={`translate(${-12 * s} ${-12 * s}) scale(${s})`}>
                {m ? m.icon : I.seed}
            </g>
        </svg>
    );
}

export default function MilestonePath({ totalNames }: { totalNames: number }) {
    const progress = totalNames / CRORE;                                  // in Crore
    const reached = MILESTONES.filter(m => progress >= m.crore).length;
    const next = MILESTONES[reached] ?? null;
    const [selected, setSelected] = useState<number>(() => (next ?? MILESTONES[LAST - 1]).crore);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Share of the way from the last reached milestone to the next one (0–1).
    const leg = next ? progress - (next.crore - 1) : 1;
    // The walked line runs from the start to the last reached disc, then across the
    // gap toward the next disc's edge in proportion to `leg`.
    const fillEnd = next
        ? xOf(next.crore - 1) + (STEP - DISC_R) * leg
        : xOf(LAST);

    // Open the track centred on the next milestone (only matters when it overflows, e.g. phones).
    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollLeft = Math.max(0, xOf(next ? next.crore : LAST) - el.clientWidth / 2);
    }, [next]);

    const stateOf = (cr: number): State =>
        progress >= cr ? 'done' : next && cr === next.crore ? 'next' : 'locked';

    const sel = MILESTONES[selected - 1];
    const selState = stateOf(sel.crore);
    const selRemaining = Math.max(0, sel.crore * CRORE - totalNames);
    // For the next milestone, measure the current stretch (matches its ring);
    // for ones further ahead, measure from the start.
    const selPct = selState === 'next'
        ? leg * 100
        : Math.min(100, (totalNames / (sel.crore * CRORE)) * 100);
    const selFrom = selState === 'next' && sel.crore > 1 ? ` from ${sel.crore - 1} Cr` : '';
    const kicker = selState === 'done' ? 'Milestone reached' : sel === next ? 'Next step' : 'Further ahead';

    return (
        <div className="card mp">
            <style>{css}</style>
            {/* Shared gradient for reached discs */}
            <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
                <defs>
                    <radialGradient id="mp-done" cx="35%" cy="30%" r="75%">
                        <stop offset="0%" stopColor="#FFC08A" />
                        <stop offset="55%" stopColor="#FF8C35" />
                        <stop offset="100%" stopColor="#E05500" />
                    </radialGradient>
                </defs>
            </svg>

            <div className="mp-head">
                <div className="card-label">Your Path</div>
                <div className="mp-count">{reached} / {MILESTONES.length} milestones</div>
            </div>

            <div className="mp-scroll" ref={scrollRef}>
                <div className="mp-track" style={{ width: TRACK_W }}>
                    <div className="mp-line" style={{ left: PAD, width: LAST * STEP }} />
                    <div className="mp-line-fill" style={{ left: PAD, width: Math.max(0, fillEnd - PAD) }} />

                    <div className="mp-node" style={{ left: PAD, top: 10, cursor: 'default' }} aria-hidden="true">
                        <Disc m={null} state="done" size={34} />
                        <span className="mp-cr done" style={{ marginTop: 16 }}>Start</span>
                    </div>

                    {MILESTONES.map(m => {
                        const st = stateOf(m.crore);
                        return (
                            <button
                                key={m.crore}
                                className="mp-node"
                                style={{ left: xOf(m.crore) }}
                                onClick={() => setSelected(m.crore)}
                                aria-pressed={m.crore === selected}
                                aria-label={`${m.crore} Crore, ${m.title}, ${st === 'done' ? 'reached' : st === 'next' ? 'next milestone' : 'ahead'}`}
                                title={`${m.crore} Crore · ${m.title}`}
                            >
                                <Disc m={m} state={st} size={54} selected={m.crore === selected} arc={st === 'next' ? leg : undefined} />
                                <span className={`mp-cr ${st === 'locked' ? '' : st}`}>{m.crore} Cr</span>
                                {m.crore === 10 && <span className="mp-tag">SANKALPA</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mp-detail" aria-live="polite">
                <Disc m={sel} state={selState} size={52} arc={selState === 'next' ? leg : undefined} />
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="mp-kicker">{kicker}</div>
                    <div className="mp-title">{sel.crore} Crore · {sel.title}</div>
                    <div className="mp-status">
                        {selState === 'done'
                            ? 'Reached ✓'
                            : `${formatIndianNumber(selRemaining)} names to go · ${selPct.toFixed(1)}% of the way${selFrom}`}
                    </div>
                    <div className="mp-text">{sel.description}</div>
                    {selState !== 'done' && (
                        <div className="progress-bar-wrap mp-bar">
                            <div className="progress-fill" style={{ width: `${selPct}%` }} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
