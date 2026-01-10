import React from 'react';

interface SidebarItemProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    active: boolean;
    onClick: () => void;
}

export function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${active ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:bg-black/5 hover:text-gray-900'}`}
        >
            <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span className="font-medium text-[14px]">{label}</span>
        </button>
    );
}
