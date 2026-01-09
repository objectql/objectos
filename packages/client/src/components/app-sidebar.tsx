import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@objectql/ui"
import * as LucideIcons from "lucide-react"
import { useRouter } from "../hooks/useRouter"
import { NavUser } from "./nav-user"
import { useAuth } from "../context/AuthContext"
import { DynamicIcon } from "./DynamicIcon"

export function AppSidebar({ objects, appMetadata, ...props }: React.ComponentProps<typeof Sidebar> & { objects: Record<string, any>, appMetadata?: any }) {
  const { path, navigate } = useRouter()
  const { user } = useAuth()

  // Parse current app context
  const parts = path.split('/');
  const currentApp = parts[1] === 'app' ? parts[2] : null;
  const getObjectPath = (name: string) => currentApp ? `/app/${currentApp}/object/${name}` : `/object/${name}`;
  
  const rawMenu = appMetadata?.content?.menu;
  
  // Normalize menu structure to always be a list of sections (groups)
  // If the first item has a 'type' or doesn't look like a section container, wrap it in a default section.
  const isGrouped = Array.isArray(rawMenu) && rawMenu.length > 0 && 
                    (rawMenu[0].items && !rawMenu[0].type); 
  
  const menuSections = rawMenu ? (isGrouped ? rawMenu : [{ label: 'Menu', items: rawMenu }]) : [];

  const renderMenuItem = (item: any, idx: number) => {
    if (item.visible === false) return null;

    // Handle Separator/Divider
    if (item.type === 'divider') {
        return <div key={idx} className="my-2 h-px bg-border" />;
    }

    // Determine active state
    let isActive = false;
    if (item.type === 'object') {
        isActive = path.includes(`/object/${item.object}`);
    } else if (item.type === 'page' || item.type === 'url') {
        isActive = item.url ? path.endsWith(item.url) : false;
    }

    const handleClick = () => {
        if (item.type === 'object' && item.object) {
            navigate(getObjectPath(item.object));
        } else if (item.type === 'page' && item.url) {
            navigate(item.url);
        } else if (item.type === 'url' && item.url) {
           window.open(item.url, '_blank');
        }
    };

    // Handle Nested Items (Submenus)
    if (item.items && item.items.length > 0) {
        return (
            <Collapsible key={idx} asChild defaultOpen={item.collapsed === false} className="group/collapsible">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.label}>
                             <DynamicIcon name={item.icon} fallback={item.type === 'object' ? LucideIcons.FileText : LucideIcons.Layout} />
                             <span>{item.label}</span>
                             <LucideIcons.ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((subItem: any, subIdx: number) => {
                                if (subItem.visible === false) return null;
                                return (
                                <SidebarMenuSubItem key={subIdx}>
                                    <SidebarMenuSubButton 
                                        isActive={subItem.type === 'object' ? path.includes(`/object/${subItem.object}`) : path.endsWith(subItem.url)}
                                        onClick={() => {
                                            if (subItem.type === 'object') navigate(getObjectPath(subItem.object));
                                            else if (subItem.type === 'page') navigate(subItem.url);
                                            else if (subItem.type === 'url') window.open(subItem.url, '_blank');
                                        }}
                                    >
                                        <span>{subItem.label}</span>
                                        {subItem.badge && <span className="ml-auto text-xs text-muted-foreground">{subItem.badge}</span>}
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                );
                            })}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    return (
        <SidebarMenuItem key={idx}>
            <SidebarMenuButton 
                isActive={isActive}
                onClick={handleClick}
            >
                <DynamicIcon name={item.icon} fallback={item.type === 'object' ? LucideIcons.FileText : LucideIcons.Layout} />
                <span>{item.label}</span>
                {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => navigate('/')}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LucideIcons.Database className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{appMetadata?.content?.name || 'ObjectQL'}</span>
                <span className="truncate text-xs">Data Browser</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuSections.length > 0 ? (
            menuSections.map((section: any, idx: number) => {
                const isCollapsible = section.collapsible === true;
                const isCollapsed = section.collapsed === true;
                
                // Helper to render group content
                const renderGroupContent = () => (
                   <SidebarMenu>
                        {section.items?.map((item: any, itemIdx: number) => renderMenuItem(item, itemIdx))}
                   </SidebarMenu>
                );

                if (isCollapsible) {
                    return (
                        <Collapsible 
                            key={idx} 
                            defaultOpen={!isCollapsed} 
                            className="group/section"
                        >
                            <SidebarGroup>
                                <SidebarGroupLabel asChild>
                                    <CollapsibleTrigger>
                                        {section.label}
                                        <LucideIcons.ChevronDown className="ml-auto transition-transform group-data-[state=closed]/section:-rotate-90" />
                                    </CollapsibleTrigger>
                                </SidebarGroupLabel>
                                <CollapsibleContent>
                                    <SidebarGroupContent>
                                        {renderGroupContent()}
                                    </SidebarGroupContent>
                                </CollapsibleContent>
                            </SidebarGroup>
                        </Collapsible>
                    );
                }

                return (
                    <SidebarGroup key={idx}>
                        <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            {renderGroupContent()}
                        </SidebarGroupContent>
                    </SidebarGroup>
                );
            })
        ) : (
            // Render Default Object List
            <SidebarGroup>
            <SidebarGroupLabel>Collections</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                {Object.entries(objects).map(([name, schema]) => (
                    <SidebarMenuItem key={name}>
                    <SidebarMenuButton 
                        isActive={path.includes(`/object/${name}`)}
                        onClick={() => navigate(getObjectPath(name))}
                        >
                        <LucideIcons.FileText />
                        <span>{schema.label || schema.title || name}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                </SidebarMenu>
            </SidebarGroupContent>
            </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
         <NavUser user={{
             name: user?.name || 'User',
             email: user?.email || '',
             avatar: user?.image
         }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
