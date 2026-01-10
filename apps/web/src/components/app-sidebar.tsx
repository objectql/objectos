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
} from "@objectos/ui"
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
  
  const rawMenu = appMetadata?.menu;
  
  // Robust check for grouped vs flat menu structure
  // A section has 'items' but NO 'type', 'object', or 'url'
  const isSection = (item: any) => item && item.items && Array.isArray(item.items) && !item.type && !item.object && !item.url;

  const isGrouped = Array.isArray(rawMenu) && rawMenu.length > 0 && isSection(rawMenu[0]);
  
  // Use a special key/flag for the default wrapper to hide the label later
  const menuSections = rawMenu ? (isGrouped ? rawMenu : [{ label: 'Menu', items: rawMenu, _isDefaultWrapper: true }]) : [];

  const renderMenuItem = (item: any, idx: number) => {
    if (item.visible === false) return null;

    // Handle Separator/Divider
    if (item.type === 'divider') {
        return <div key={idx} className="my-2 h-px bg-border" />;
    }

    // Default label if missing (e.g. for dividers context or malformed data)
    const label = item.label || '';
    const itemType = item.type || 'page';

    // Determine active state
    let isActive = false;
    if (itemType === 'object') {
        isActive = path.includes(`/object/${item.object}`);
    } else if (itemType === 'page' || itemType === 'url') {
        isActive = item.url ? path.endsWith(item.url) : false;
    }

    const handleClick = () => {
        if (itemType === 'object' && item.object) {
            navigate(getObjectPath(item.object));
        } else if (itemType === 'page' && item.url) {
            navigate(item.url);
        } else if (itemType === 'url' && item.url) {
           window.open(item.url, '_blank');
        }
    };

    // Handle Nested Items (Submenus)
    if (item.items && item.items.length > 0) {
        return (
            <Collapsible key={idx} asChild defaultOpen={false} className="group/collapsible">
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={label}>
                             <DynamicIcon name={item.icon} fallback={itemType === 'object' ? LucideIcons.FileText : LucideIcons.Layout} />
                             <span>{label}</span>
                             <LucideIcons.ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((subItem: any, subIdx: number) => {
                                if (subItem.visible === false) return null;
                                const subItemType = subItem.type || 'page';
                                return (
                                <SidebarMenuSubItem key={subIdx}>
                                    <SidebarMenuSubButton 
                                        isActive={subItemType === 'object' ? path.includes(`/object/${subItem.object_name}`) : path.endsWith(subItem.url)}
                                        onClick={() => {
                                            if (subItemType === 'object') navigate(getObjectPath(subItem.object_name));
                                            else if (subItemType === 'page') navigate(subItem.url);
                                            else if (subItemType === 'url') window.open(subItem.url, '_blank');
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
                <DynamicIcon name={item.icon} fallback={itemType === 'object' ? LucideIcons.FileText : LucideIcons.Layout} />
                <span>{label}</span>
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
                <span className="truncate font-semibold">{appMetadata?.label || 'ObjectQL'}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {menuSections.map((section: any, idx: number) => {
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
                        {!section._isDefaultWrapper && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
                        <SidebarGroupContent>
                            {renderGroupContent()}
                        </SidebarGroupContent>
                    </SidebarGroup>
                );
            })}
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
