import { 
    Avatar, 
    AvatarFallback, 
    AvatarImage, 
    DropdownMenu, 
    DropdownMenuTrigger, 
    DropdownMenuContent, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuGroup, 
    DropdownMenuItem 
} from '@objectos/ui';
import { LogOut, Settings as SettingsIcon, Building, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Outlet } from 'react-router-dom';

export function MainLayout() {
    const { user, signOut } = useAuth();

    return (
        <div className="flex flex-col min-h-screen w-full bg-background">
            <header className="flex h-16 shrink-0 items-center gap-4 border-b px-6 bg-card sticky top-0 z-50">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <span>ObjectOS</span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 outline-none">
                                <Avatar className="h-8 w-8 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={user?.image} alt={user?.name} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
                            <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user?.image} alt={user?.name} />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user?.name}</span>
                                <span className="truncate text-xs">{user?.email}</span>
                                </div>
                            </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <Building className="mr-2 h-4 w-4" />
                                    Organization
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Bell className="mr-2 h-4 w-4" />
                                    Notifications
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto w-full">
                     <h1 className="text-2xl font-bold mb-6">Apps</h1>
                     <Outlet />
                </div>
            </div>
        </div>
    );
}
