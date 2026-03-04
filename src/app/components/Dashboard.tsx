import { useState, useEffect, useCallback } from 'react';
import { signInWithGoogle, signOut } from '@/lib/firebase-client';
import { getTodayString, daysAgo } from '@/lib/date-helpers';
import { CHANTING } from '@/lib/constants';

const GOAL = CHANTING.DEFAULT_GOAL_NAMES;
const NAMES_PER_MAALA = CHANTING.NAMES_PER_MAALA;

function fmt(d: Date) { return d.toISOString().split('T')[0]; }
function fmtIN(n: number) {
    if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
    if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
    return n.toLocaleString('en-IN');
}
function daysIn(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface Entry {
    date: string;
    maalas: number;
    note?: string;
    totalNames?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface Stats {
    totalMaalas: number;
    totalNames: number;
    percent: string;
    avgMaalas: string;
    streak: number;
    longestStreak: number;
    last7: string;
    last30: string;
    daysRem: number;
    projDate: string;
    totalDays: number;
    activeDays: number;
    percentComplete: number;
    remainingNames: number;
    projectedCompletionDate: string;
    estimatedDaysRemaining: number;
    last7DaysAvgMaalas: number;
    last30DaysAvgMaalas: number;
    allTimeAvgMaalas: number;
}

function calcStats(entries: Entry[]): Stats {
    if (!entries.length) return {
        totalMaalas: 0, totalNames: 0, percent: '0.00', avgMaalas: '0.0', streak: 0, longestStreak: 0,
        last7: '0.0', last30: '0.0', daysRem: -1, projDate: 'N/A', totalDays: 0, activeDays: 0,
        percentComplete: 0, remainingNames: GOAL, projectedCompletionDate: 'INSUFFICIENT_DATA', estimatedDaysRemaining: -1,
        last7DaysAvgMaalas: 0, last30DaysAvgMaalas: 0, allTimeAvgMaalas: 0
    };

    const entriesMap = new Map<string, number>();
    let totalM = 0;
    entries.forEach(e => {
        entriesMap.set(e.date, e.maalas);
        totalM += e.maalas;
    });
    
    const totalN = totalM * NAMES_PER_MAALA;
    const dates = [...entriesMap.keys()].sort();
    const first = new Date(dates[0]);
    const today = new Date();
    const calDays = Math.ceil((today.getTime() - first.getTime()) / 864e5) + 1;
    
    const avgN = (n: number) => { 
        let s = 0; 
        for (let i = 0; i < n; i++) { 
            const dd = new Date(today); 
            dd.setDate(dd.getDate() - i); 
            const val = entriesMap.get(fmt(dd));
            if (val) s += val; 
        } 
        return s / n; 
    };
    
    const l7 = avgN(7), l30 = avgN(30), allT = totalM / calDays;
    const wAvg = l7 * .5 + l30 * .3 + allT * .2;
    const rem = GOAL - totalN;
    const dR = rem <= 0 ? 0 : wAvg > 0 ? Math.ceil(rem / (wAvg * NAMES_PER_MAALA)) : -1;
    const pD = new Date(today); pD.setDate(pD.getDate() + dR);
    
    let streak = 0, dd = new Date(today);
    while (entriesMap.has(fmt(dd)) && entriesMap.get(fmt(dd))! > 0) { streak++; dd.setDate(dd.getDate() - 1); }
    let longest = 0, cur = 0;
    for (let i = 0; i < calDays; i++) { 
        const x = new Date(first); 
        x.setDate(x.getDate() + i); 
        const val = entriesMap.get(fmt(x));
        if (val && val > 0) { cur++; longest = Math.max(longest, cur); } else cur = 0; 
    }
    
    const percent = ((totalN / GOAL) * 100).toFixed(2);
    
    return {
        totalMaalas: totalM, totalNames: totalN, percent,
        avgMaalas: allT.toFixed(1), streak, longestStreak: longest,
        last7: l7.toFixed(1), last30: l30.toFixed(1), daysRem: dR,
        projDate: dR === 0 ? 'Complete!' : dR < 0 ? 'N/A' : pD.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        totalDays: calDays, activeDays: dates.length,
        percentComplete: parseFloat(percent),
        remainingNames: Math.max(0, GOAL - totalN),
        projectedCompletionDate: dR === 0 ? 'COMPLETE' : dR < 0 ? 'INSUFFICIENT_DATA' : fmt(pD),
        estimatedDaysRemaining: dR,
        last7DaysAvgMaalas: parseFloat(l7.toFixed(2)),
        last30DaysAvgMaalas: parseFloat(l30.toFixed(2)),
        allTimeAvgMaalas: parseFloat(allT.toFixed(2)),
    };
}

const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
    
    :root {
        --bg: #0A0908; --surface: rgba(255,255,255,0.03); --surface2: rgba(255,255,255,0.06);
        --border: rgba(255,255,255,0.06); --border-accent: rgba(234,179,8,0.2);
        --gold: #EAB308; --gold-dim: #CA8A04; --gold-glow: rgba(234,179,8,0.15);
        --text: #FAFAF9; --text2: #A8A29E; --text3: #57534E;
        --red: #EF4444; --green: #22C55E;
        --font: 'Outfit', sans-serif; --mono: 'JetBrains Mono', monospace;
        --radius: 14px; --radius-sm: 8px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    .app {
        min-height: 100vh; background: var(--bg); color: var(--text);
        font-family: var(--font); overflow-x: hidden;
        background-image: radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.03) 0%, transparent 60%);
    }
    .header {
        padding: 20px 20px 16px; border-bottom: 1px solid var(--border);
        position: sticky; top: 0; z-index: 50;
        background: rgba(10,9,8,0.92); backdrop-filter: blur(20px);
    }
    .header-inner { max-width: 720px; margin: 0 auto; display: flex; align-items: center; gap: 12px; }
    .header h1 {
        font-size: 20px; font-weight: 700; letter-spacing: -0.02em;
        background: linear-gradient(135deg, #FBBF24, #EAB308);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .header-sub { font-size: 11px; color: var(--text3); font-family: var(--mono); letter-spacing: 0.05em; }
    .tabs {
        display: flex; gap: 0; border-bottom: 1px solid var(--border);
        padding: 0 20px; overflow-x: auto; -webkit-overflow-scrolling: touch;
        scrollbar-width: none; position: sticky; top: 57px; z-index: 40;
        background: rgba(10,9,8,0.92); backdrop-filter: blur(20px);
    }
    .tabs::-webkit-scrollbar { display: none; }
    .tab {
        padding: 12px 16px; font-size: 12px; font-weight: 500; font-family: var(--mono);
        text-transform: uppercase; letter-spacing: 0.08em; white-space: nowrap;
        background: none; border: none; cursor: pointer; color: var(--text3);
        border-bottom: 2px solid transparent; transition: all 0.2s;
    }
    .tab.active { color: var(--gold); border-bottom-color: var(--gold); }
    .content { max-width: 720px; margin: 0 auto; padding: 20px; }
    .card {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--radius); padding: 20px; margin-bottom: 16px;
    }
    .card-accent {
        background: linear-gradient(135deg, var(--gold-glow), rgba(234,179,8,0.05));
        border-color: var(--border-accent);
    }
    .card-label {
        font-size: 10px; font-family: var(--mono); text-transform: uppercase;
        letter-spacing: 0.08em; color: var(--text3); margin-bottom: 10px;
    }

    .today-hero {
        background: linear-gradient(145deg, rgba(234,179,8,0.08), rgba(234,179,8,0.02));
        border: 1px solid var(--border-accent);
        border-radius: var(--radius); padding: 24px; margin-bottom: 16px;
        position: relative; overflow: hidden;
    }
    .today-hero::before {
        content: ''; position: absolute; top: -60%; right: -20%; width: 200px; height: 200px;
        background: radial-gradient(circle, rgba(234,179,8,0.08), transparent 70%);
        pointer-events: none;
    }
    .today-date { font-size: 13px; color: var(--gold-dim); font-family: var(--mono); margin-bottom: 6px; }
    .today-count-row { display: flex; align-items: center; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
    .today-big {
        font-size: 56px; font-weight: 800; color: var(--gold);
        font-family: var(--mono); line-height: 1; letter-spacing: -0.03em;
    }
    .today-unit { font-size: 14px; color: var(--text2); }
    .today-names { font-size: 12px; color: var(--text3); font-family: var(--mono); }

    .controls-wrap { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
    .quick-btns { display: flex; gap: 6px; }
    .quick-btn {
        width: 48px; height: 48px; border-radius: 12px; font-size: 16px;
        font-family: var(--mono); font-weight: 600; display: flex;
        align-items: center; justify-content: center; cursor: pointer;
        border: 1px solid var(--border); transition: all 0.15s;
    }
    .quick-btn.minus { background: rgba(239,68,68,0.08); color: var(--red); border-color: rgba(239,68,68,0.15); }
    .quick-btn.minus:hover { background: rgba(239,68,68,0.15); }
    .quick-btn.plus { background: var(--gold-glow); color: var(--gold); border-color: var(--border-accent); }
    .quick-btn.plus:hover { background: rgba(234,179,8,0.25); }

    .set-row { display: flex; gap: 6px; align-items: center; }
    .input-field {
        width: 80px; padding: 10px 12px; border-radius: var(--radius-sm);
        background: rgba(0,0,0,0.3); border: 1px solid var(--border);
        color: var(--text); font-size: 14px; font-family: var(--mono); outline: none;
    }
    .input-field:focus { border-color: var(--gold); }
    .input-field::placeholder { color: var(--text3); }

    .btn {
        padding: 10px 18px; border-radius: var(--radius-sm); font-size: 13px;
        font-family: var(--mono); font-weight: 500; border: 1px solid var(--border);
        cursor: pointer; transition: all 0.15s; display: inline-flex;
        align-items: center; gap: 6px; white-space: nowrap;
    }
    .btn-ghost { background: var(--surface2); color: var(--text); }
    .btn-ghost:hover { background: rgba(255,255,255,0.1); }
    .btn-gold { background: var(--gold); color: #0A0908; border-color: var(--gold); font-weight: 600; }
    .btn-gold:hover { background: #FBBF24; }
    .btn-danger { background: transparent; color: var(--red); border-color: rgba(239,68,68,0.2); font-size: 12px; }
    .btn-danger:hover { background: rgba(239,68,68,0.1); }
    .btn-lg { padding: 14px 24px; font-size: 15px; border-radius: 12px; }

    .cta-card {
        background: linear-gradient(145deg, rgba(234,179,8,0.06), rgba(234,179,8,0.02));
        border: 2px dashed var(--border-accent); border-radius: var(--radius);
        padding: 40px 24px; text-align: center; margin-bottom: 16px;
    }
    .cta-icon { font-size: 52px; margin-bottom: 16px; }
    .cta-title { font-size: 20px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
    .cta-sub { font-size: 13px; color: var(--text2); margin-bottom: 24px; line-height: 1.5; }
    .cta-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; }

    .ring-wrap { position: relative; flex-shrink: 0; }
    .ring-label {
        position: absolute; inset: 0; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
    }
    .ring-pct { font-size: 24px; font-weight: 800; color: var(--gold); font-family: var(--mono); }
    .ring-sub { font-size: 10px; color: var(--text3); margin-top: 2px; }
    .progress-row { display: flex; align-items: center; gap: 24px; }
    .progress-bar-wrap { height: 8px; border-radius: 4px; background: var(--surface2); overflow: hidden; }
    .progress-fill {
        height: 100%; border-radius: 4px;
        background: linear-gradient(90deg, #CA8A04, #EAB308, #FBBF24);
        transition: width 1s cubic-bezier(.4,0,.2,1);
    }

    .stat-grid { display: grid; gap: 10px; margin-bottom: 16px; }
    .sg3 { grid-template-columns: repeat(3, 1fr); }
    .sg2 { grid-template-columns: repeat(2, 1fr); }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
    .stat-icon { font-size: 18px; margin-bottom: 6px; }
    .stat-val { font-size: 18px; font-weight: 700; color: var(--text); font-family: var(--mono); }
    .stat-label { font-size: 10px; color: var(--text3); font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 2px; }
    .avg-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .avg-label { font-size: 13px; color: var(--text2); }
    .avg-val { font-size: 14px; font-weight: 600; color: var(--gold); font-family: var(--mono); }

    .bars { display: flex; align-items: flex-end; gap: 2px; height: 56px; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; }
    .bar { width: 100%; min-width: 3px; border-radius: 2px; transition: height 0.4s ease; }
    .bar-legend { display: flex; justify-content: space-between; margin-top: 6px; }
    .bar-legend span { font-size: 9px; color: var(--text3); font-family: var(--mono); }

    .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .cal-title { font-size: 17px; font-weight: 600; }
    .cal-btn {
        width: 36px; height: 36px; border-radius: 8px; display: flex;
        align-items: center; justify-content: center; font-size: 16px;
        background: var(--surface2); border: 1px solid var(--border); color: var(--text2); cursor: pointer;
    }
    .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; }
    .cal-dow { text-align: center; font-size: 10px; color: var(--text3); font-family: var(--mono); text-transform: uppercase; padding: 4px 0; }
    .cal-cell {
        aspect-ratio: 1; border-radius: var(--radius-sm); display: flex;
        flex-direction: column; align-items: center; justify-content: center;
        border: 1px solid transparent; cursor: pointer; transition: all 0.15s;
        min-height: 40px; font-size: 13px; background: none;
    }
    .cal-cell:hover { border-color: var(--border-accent); }
    .cal-cell.cal-today { border: 2px solid var(--gold) !important; }
    .cal-cell.cal-sel { background: rgba(234,179,8,0.15) !important; border-color: var(--gold) !important; }
    .cal-maalas { font-size: 8px; color: var(--gold-dim); font-family: var(--mono); margin-top: 1px; }

    .hist-item {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 14px; border-radius: var(--radius-sm); margin-bottom: 4px;
        border: 1px solid var(--border); background: var(--surface);
    }
    .hist-today { background: var(--gold-glow); border-color: var(--border-accent); }
    .hist-date { font-size: 13px; color: var(--text); }
    .hist-names { font-size: 11px; color: var(--text3); margin-top: 2px; }
    .hist-val { font-size: 18px; font-weight: 700; color: var(--gold); font-family: var(--mono); }
    .hist-unit { font-size: 11px; font-weight: 400; color: var(--text3); margin-left: 3px; }
    .badge {
        display: inline-block; font-size: 9px; color: var(--gold); background: var(--gold-glow);
        padding: 2px 6px; border-radius: 4px; font-family: var(--mono); margin-left: 8px;
    }

    .auth-screen {
        min-height: 100vh; display: flex; align-items: center; justify-content: center;
        background: var(--bg); padding: 20px;
        background-image: radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.03) 0%, transparent 60%);
    }
    .auth-card {
        width: 100%; max-width: 400px;
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--radius); padding: 32px 24px;
    }
    .auth-logo { font-size: 48px; text-align: center; margin-bottom: 16px; }
    .auth-title {
        font-size: 24px; font-weight: 700; text-align: center;
        background: linear-gradient(135deg, #FBBF24, #EAB308);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        margin-bottom: 4px;
    }
    .auth-sub { font-size: 12px; color: var(--text3); text-align: center; font-family: var(--mono); margin-bottom: 24px; }
    .auth-btn {
        width: 100%; padding: 14px 20px; border-radius: 12px; font-size: 15px;
        font-family: var(--font); font-weight: 600; cursor: pointer; transition: all 0.15s;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        border: none;
    }
    .auth-btn.google { background: #fff; color: #333; }
    .auth-btn.google:hover { background: #f5f5f5; }

    .loading { display: flex; align-items: center; justify-content: center; min-height: 200px; color: var(--text2); }

    @media (max-width: 600px) {
        .content { padding: 14px; }
        .header { padding: 14px 14px 12px; }
        .header h1 { font-size: 17px; }
        .tabs { padding: 0 14px; top: 52px; }
        .tab { padding: 10px 12px; font-size: 11px; }
        .stat-card { padding: 10px; }
        .stat-val { font-size: 15px; }
        .stat-icon { font-size: 15px; margin-bottom: 4px; }
        .today-big { font-size: 44px; }
        .progress-row { flex-direction: column; gap: 16px; align-items: stretch; }
        .ring-wrap { align-self: center; }
        .card { padding: 16px; }
        .today-hero { padding: 18px; }
        .cal-cell { min-height: 36px; font-size: 12px; }
        .cta-card { padding: 28px 16px; }
        .quick-btn { width: 44px; height: 44px; font-size: 15px; }
        .sg2 { grid-template-columns: 1fr; }
        .controls-wrap { gap: 8px; }
        .set-row { width: 100%; }
        .input-field { flex: 1; width: auto; }
    }
    @media (max-width: 380px) {
        .sg3 { grid-template-columns: 1fr 1fr; }
        .today-big { font-size: 36px; }
        .quick-btn { width: 40px; height: 40px; font-size: 14px; }
        .cta-card { padding: 20px 12px; }
        .cta-icon { font-size: 40px; }
        .cta-title { font-size: 17px; }
        .btn-lg { padding: 12px 18px; font-size: 14px; }
    }
`;

function Ring({ percent, size = 140 }: { percent: number; size?: number }) {
    const stroke = 12, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
    const p = Math.min(percent, 100);
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#rg)" strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={circ * (1 - p / 100)} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
            <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EAB308" /><stop offset="100%" stopColor="#F59E0B" />
            </linearGradient></defs>
        </svg>
    );
}

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

interface DashboardProps {
    isAuthenticated: boolean;
    onLogin: () => Promise<void>;
    onLogout: () => void;
}

export default function Dashboard({ isAuthenticated, onLogin, onLogout }: DashboardProps) {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [selDate, setSelDate] = useState(new Date());
    const [vMonth, setVMonth] = useState(new Date().getMonth());
    const [vYear, setVYear] = useState(new Date().getFullYear());
    const [editVal, setEditVal] = useState('');
    const [tab, setTab] = useState('today');

    const TODAY = getTodayString();
    const selKey = fmt(selDate);

    const fetchEntries = useCallback(async () => {
        try {
            const from = daysAgo(30);
            const to = TODAY;
            const res = await fetch(`/api/entries?from=${from}&to=${to}`, { headers: getAuthHeaders() });
            
            if (res.ok) {
                const data = await res.json();
                setEntries(data.entries || []);
            }
        } catch (err) {
            console.error('Failed to fetch entries:', err);
        }
    }, [TODAY]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/stats', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                const computed = calcStats(entries);
                setStats({ ...computed, ...data });
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setStats(calcStats(entries));
        }
    }, [entries]);

    useEffect(() => {
        if (isAuthenticated && !initialLoadDone) {
            setLoading(true);
            Promise.all([fetchEntries(), fetchStats()]).then(() => {
                setInitialLoadDone(true);
                setLoading(false);
            });
        } else if (!isAuthenticated && initialLoadDone) {
            setInitialLoadDone(false);
            setEntries([]);
            setStats(null);
        }
    }, [isAuthenticated, initialLoadDone, fetchEntries, fetchStats]);

    const saveEntry = async (date: string, maalas: number) => {
        if (isNaN(maalas) || maalas < 0 || maalas > 200) return;
        try {
            const res = await fetch('/api/entries', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ date, maalas }),
            });
            
            if (res.ok) {
                await fetchEntries();
                await fetchStats();
            }
        } catch (err) {
            console.error('Failed to save entry:', err);
        }
        setEditVal('');
    };

    const deleteEntry = async (date: string) => {
        try {
            const res = await fetch(`/api/entries/${date}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            
            if (res.ok) {
                await fetchEntries();
                await fetchStats();
            }
        } catch (err) {
            console.error('Failed to delete entry:', err);
        }
    };

    const inc = (date: string, n: number) => {
        const entry = entries.find(e => e.date === date);
        const cur = entry?.maalas || 0;
        saveEntry(date, Math.max(0, Math.min(200, cur + n)));
    };

    const entriesMap = new Map(entries.map(e => [e.date, e]));

    const last30 = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dateStr = fmt(d);
        const entry = entriesMap.get(dateStr);
        return { date: dateStr, maalas: entry?.maalas || 0, day: d.getDate() };
    });

    const firstDow = new Date(vYear, vMonth, 1).getDay();
    const dim = daysIn(vYear, vMonth);
    const calCells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) calCells.push(null);
    for (let i = 1; i <= dim; i++) calCells.push(i);

    const EntryEditor = ({ dateKey }: { dateKey: string }) => {
        const entry = entriesMap.get(dateKey);
        const dateObj = new Date(dateKey + 'T00:00:00');
        const isToday = dateKey === TODAY;
        const dayLabel = isToday ? 'Today' : dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
        const fullDate = dateObj.toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });

        if (!entry) {
            return (
                <div className="cta-card">
                    <div className="cta-icon">📿</div>
                    <div className="cta-title">{isToday ? "Log Today's Sadhana" : 'No Entry'}</div>
                    <div className="cta-sub">
                        {isToday ? 'How many maalas did you chant today?' : `${dayLabel}, ${fullDate}`}
                    </div>
                    <div className="cta-actions">
                        <button className="btn btn-gold btn-lg" onClick={() => saveEntry(dateKey, 16)}>
                            📿 Add 16 Maalas
                        </button>
                        <div className="set-row">
                            <input className="input-field" type="number" min="0" max="200"
                                placeholder="Custom" value={editVal} onChange={e => setEditVal(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveEntry(dateKey, parseInt(editVal))} />
                            <button className="btn btn-ghost" onClick={() => saveEntry(dateKey, parseInt(editVal))}>Add</button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="today-hero">
                <div className="today-date">{dayLabel}, {fullDate}</div>
                <div className="today-count-row">
                    <div className="today-big">{entry.maalas}</div>
                    <div>
                        <div className="today-unit">maalas completed</div>
                        <div className="today-names">{(entry.maalas * NAMES_PER_MAALA).toLocaleString('en-IN')} names</div>
                    </div>
                </div>
                <div className="controls-wrap">
                    <div className="quick-btns">
                        <button className="quick-btn minus" onClick={() => inc(dateKey, -4)}>-4</button>
                        <button className="quick-btn minus" onClick={() => inc(dateKey, -1)}>-1</button>
                        <button className="quick-btn plus" onClick={() => inc(dateKey, 1)}>+1</button>
                        <button className="quick-btn plus" onClick={() => inc(dateKey, 4)}>+4</button>
                    </div>
                    <div className="set-row">
                        <input className="input-field" type="number" min="0" max="200"
                            placeholder="Set" value={editVal} onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveEntry(dateKey, parseInt(editVal))} />
                        <button className="btn btn-gold" onClick={() => saveEntry(dateKey, parseInt(editVal))}>Set</button>
                    </div>
                    <button className="btn btn-danger" onClick={() => deleteEntry(dateKey)}>Delete Entry</button>
                </div>
                {entry.note && (
                    <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text2)', fontStyle: 'italic' }}>
                        Note: {entry.note}
                    </div>
                )}
            </div>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="app">
                <style>{CSS}</style>
                <div className="auth-screen">
                    <div className="auth-card">
                        <div className="auth-logo">🙏</div>
                        <div className="auth-title">Naam Jaap Tracker</div>
                        <div className="auth-sub">हरे कृष्ण — 10 Crore</div>
                        
                        <button className="auth-btn google" onClick={onLogin}>
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="app">
                <style>{CSS}</style>
                <div className="loading">Loading...</div>
            </div>
        );
    }

    const currentStats = stats || calcStats(entries);

    return (
        <div className="app">
            <style>{CSS}</style>
            <div className="header">
                <div className="header-inner">
                    <span style={{ fontSize: 24 }}>🙏</span>
                    <div>
                        <h1>Naam Jaap Tracker</h1>
                        <div className="header-sub">हरे कृष्ण — 10 Crore</div>
                    </div>
                    <button 
                        onClick={onLogout}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12 }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="tabs">
                {[
                    { id: 'today', label: 'Today' },
                    { id: 'overview', label: 'Overview' },
                    { id: 'calendar', label: 'Calendar' },
                    { id: 'history', label: 'History' },
                ].map(t => (
                    <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`}
                        onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
            </div>

            <div className="content">
                {tab === 'today' && (
                    <div>
                        <EntryEditor dateKey={TODAY} />
                        <div className="stat-grid sg3">
                            {[
                                { icon: '🔥', val: currentStats.streak, label: 'Streak' },
                                { icon: '📿', val: currentStats.totalMaalas.toLocaleString('en-IN'), label: 'Total Maalas' },
                                { icon: '🎯', val: currentStats.percent + '%', label: 'Complete' },
                            ].map(s => (
                                <div className="stat-card" key={s.label}>
                                    <div className="stat-icon">{s.icon}</div>
                                    <div className="stat-val">{s.val}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtIN(currentStats.totalNames)}</span>
                                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{fmtIN(GOAL)}</span>
                            </div>
                            <div className="progress-bar-wrap">
                                <div className="progress-fill" style={{ width: `${Math.min(currentStats.percentComplete, 100)}%` }} />
                            </div>
                            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)' }}>
                                Est. completion: <span style={{ color: 'var(--gold)', fontFamily: 'var(--mono)' }}>{currentStats.projDate}</span>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'overview' && (
                    <div>
                        <div className="card">
                            <div className="progress-row">
                                <div className="ring-wrap">
                                    <Ring percent={currentStats.percentComplete} />
                                    <div className="ring-label">
                                        <span className="ring-pct">{currentStats.percent}%</span>
                                        <span className="ring-sub">complete</span>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="card-label">Total Names Chanted</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold)', fontFamily: 'var(--mono)' }}>
                                        {fmtIN(currentStats.totalNames)}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, marginBottom: 12 }}>
                                        of {fmtIN(GOAL)} ({currentStats.totalMaalas.toLocaleString('en-IN')} maalas)
                                    </div>
                                    <div className="progress-bar-wrap">
                                        <div className="progress-fill" style={{ width: `${Math.min(currentStats.percentComplete, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="stat-grid sg3">
                            {[
                                { icon: '🔥', val: `${currentStats.streak}d`, label: 'Current Streak' },
                                { icon: '🏆', val: `${currentStats.longestStreak}d`, label: 'Best Streak' },
                                { icon: '📅', val: `${currentStats.activeDays}/${currentStats.totalDays}`, label: 'Active Days' },
                            ].map(s => (
                                <div className="stat-card" key={s.label}>
                                    <div className="stat-icon">{s.icon}</div>
                                    <div className="stat-val">{s.val}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="stat-grid sg2">
                            <div className="card" style={{ marginBottom: 0 }}>
                                <div className="card-label">Daily Averages (maalas)</div>
                                {[{ l:'Last 7 days',v:currentStats.last7 },{ l:'Last 30 days',v:currentStats.last30 },{ l:'All time',v:currentStats.avgMaalas }].map(a => (
                                    <div className="avg-row" key={a.l}><span className="avg-label">{a.l}</span><span className="avg-val">{a.v}</span></div>
                                ))}
                            </div>
                            <div className="card card-accent" style={{ marginBottom: 0 }}>
                                <div className="card-label">Projected Completion</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{currentStats.projDate}</div>
                                <div style={{ fontSize: 12, color: 'var(--text2)' }}>~{currentStats.daysRem.toLocaleString('en-IN')} days left</div>
                                <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6, fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                                    Weighted: 50% recent · 30% monthly · 20% all-time
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ marginTop: 16 }}>
                            <div className="card-label">Last 30 Days</div>
                            <div className="bars">
                                {last30.map(d => (
                                    <div className="bar-col" key={d.date} title={`${d.date}: ${d.maalas}m`}>
                                        <div className="bar" style={{
                                            height: Math.min((d.maalas / 24) * 48, 48),
                                            background: d.maalas >= 16 ? 'linear-gradient(to top, #CA8A04, #EAB308)' : d.maalas > 0 ? 'linear-gradient(to top, #44403C, #78716C)' : 'transparent'
                                        }} />
                                    </div>
                                ))}
                            </div>
                            <div className="bar-legend"><span>{last30[0]?.day}</span><span>today</span></div>
                        </div>
                    </div>
                )}

                {tab === 'calendar' && (
                    <div>
                        <div className="cal-nav">
                            <button className="cal-btn" onClick={() => { if (vMonth === 0) { setVMonth(11); setVYear(vYear - 1); } else setVMonth(vMonth - 1); }}>←</button>
                            <span className="cal-title">{MONTHS[vMonth]} {vYear}</span>
                            <button className="cal-btn" onClick={() => { if (vMonth === 11) { setVMonth(0); setVYear(vYear + 1); } else setVMonth(vMonth + 1); }}>→</button>
                        </div>
                        <div className="cal-grid">
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div className="cal-dow" key={d}>{d}</div>)}
                            {calCells.map((day, i) => {
                                if (day === null) return <div key={`e${i}`} />;
                                const dk = `${vYear}-${String(vMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                const entry = entriesMap.get(dk);
                                const m = entry?.maalas || 0;
                                const isT = dk === TODAY, isSel = dk === selKey;
                                const intensity = Math.min(m / 24, 1);
                                return (
                                    <button key={dk}
                                        className={`cal-cell ${isT ? 'cal-today' : ''} ${isSel ? 'cal-sel' : ''}`}
                                        style={{ background: isSel ? undefined : m > 0 ? `rgba(234,179,8,${0.05 + intensity * 0.25})` : 'var(--surface)', color: m > 0 ? 'var(--text)' : 'var(--text3)' }}
                                        onClick={() => setSelDate(new Date(dk + 'T00:00:00'))}
                                    >
                                        <span>{day}</span>
                                        {m > 0 && <span className="cal-maalas">{m}m</span>}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: 16 }}><EntryEditor dateKey={selKey} /></div>
                    </div>
                )}

                {tab === 'history' && (
                    <div>
                        <div className="card-label" style={{ marginBottom: 12 }}>Recent Entries</div>
                        {last30.filter(d => d.maalas > 0).reverse().map(d => (
                            <div className={`hist-item ${d.date === TODAY ? 'hist-today' : ''}`} key={d.date}>
                                <div>
                                    <div className="hist-date">
                                        {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        {d.date === TODAY && <span className="badge">TODAY</span>}
                                    </div>
                                    <div className="hist-names">{(d.maalas * NAMES_PER_MAALA).toLocaleString('en-IN')} names</div>
                                </div>
                                <div className="hist-val">{d.maalas}<span className="hist-unit">m</span></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
