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
} from "@objectql/ui"
import { Database, FileText } from "lucide-react"
import { useRouter } from "../hooks/useRouter"
import { NavUser } from "./nav-user"
import { useAuth } from "../context/AuthContext"

export function AppSidebar({ objects, ...props }: React.ComponentProps<typeof Sidebar> & { objects: Record<string, any> }) {
  const { path, navigate } = useRouter()
  const { user } = useAuth()

  // Parse current app context
  const parts = path.split('/');
  const currentApp = parts[1] === 'app' ? parts[2] : null;
  const getObjectPath = (name: string) => currentApp ? `/app/${currentApp}/object/${name}` : `/object/${name}`;
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => navigate('/')}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Database className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">ObjectQL</span>
                <span className="truncate text-xs">Data Browser</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
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
                     <FileText />
                     <span>{schema.label || schema.title || name}</span>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               ))}
             </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
