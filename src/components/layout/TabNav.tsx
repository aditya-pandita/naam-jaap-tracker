/**
 * @file src/components/layout/TabNav.tsx
 * @description Sticky tab navigation bar.
 */

interface TabNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'overview', label: 'Overview' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'history', label: 'History' },
];

export function TabNav({ activeTab, onTabChange }: TabNavProps) {
    return (
        <nav className="sticky top-[57px] z-40 backdrop-blur-xl bg-[rgba(10,9,8,0.92)] border-b border-[rgba(255,255,255,0.06)]">
            <div className="max-w-[720px] mx-auto overflow-x-auto">
                <div className="flex gap-0 px-5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                                px-4 py-3 text-[12px] font-mono font-medium uppercase tracking-wider whitespace-nowrap
                                bg-none border-none cursor-pointer
                                border-b-2 transition-all duration-200
                                ${
                                    activeTab === tab.id
                                        ? 'text-[#EAB308] border-b-[#EAB308]'
                                        : 'text-[#57534E] border-b-transparent hover:text-[#A8A29E]'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}
