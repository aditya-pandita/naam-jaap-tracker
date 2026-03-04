/**
 * @file src/components/layout/Header.tsx
 * @description Sticky header with app title and subtitle.
 */

export function Header() {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(10,9,8,0.92)] border-b border-[rgba(255,255,255,0.06)]">
            <div className="max-w-[720px] mx-auto px-5 py-5 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🙏</span>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#FBBF24] to-[#EAB308] bg-clip-text text-transparent">
                            Naam Jaap Tracker
                        </h1>
                        <div className="text-[11px] text-[#57534E] font-mono tracking-widest">
                            हरे कृष्ण — 10 Crore
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
