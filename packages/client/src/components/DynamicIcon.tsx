import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps extends React.ComponentProps<'svg'> {
    name?: string;
    fallback?: React.ElementType;
    className?: string;
}

export function DynamicIcon({ name, fallback, className, ...props }: DynamicIconProps) {
    const Fallback = fallback || LucideIcons.FileText;
    
    if (!name) {
        return <Fallback className={className} {...props} />;
    }

    let iconName = name;
    
    // Handle Remix Icon names (ri-dashboard-line -> Dashboard)
    // Common mappings if needed, or just stripping prefixes
    if (name.startsWith('ri-')) {
        iconName = name
            .replace(/^ri-/, '')
            .replace(/-line$/, '')
            .replace(/-fill$/, '');
    }

    // Convert kebab-case to PascalCase (dashboard-layout -> DashboardLayout)
    const pascalName = iconName
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
    
    // Try to find the icon in Lucide
    // 1. Exact PascalCase match
    // 2. Case-insensitive match (less likely needed if normalization is good)
    const IconComponent = (LucideIcons as any)[pascalName] || (LucideIcons as any)[iconName];
    
    if (IconComponent) {
        return <IconComponent className={className} {...props} />;
    }
    
    // If not found, return fallback
    return <Fallback className={className} {...props} />;
}
