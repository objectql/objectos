import { useListOrganizations, organization, useActiveOrganization } from '@/lib/auth-client';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronsUpDown, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OrganizationSwitcher() {
  const { data: organizations, isPending } = useListOrganizations();
  const { data: activeOrg } = useActiveOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isPending) {
    return <div className="h-8 w-32 bg-muted animate-pulse rounded-md" />;
  }

  const handleSwitchOrg = async (orgId: string) => {
    await organization.setActive({ organizationId: orgId });
    setIsOpen(false);
  };

  const currentOrg = organizations?.find((o) => o.id === activeOrg?.id) || organizations?.[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <div className="size-5 rounded bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
          {currentOrg?.name?.charAt(0).toUpperCase() || 'P'}
        </div>
        <span className="max-w-[100px] truncate">{currentOrg?.name || 'Personal'}</span>
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-md border bg-popover text-popover-foreground shadow-md z-50">
          <div className="p-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Organizations
            </div>
            {organizations?.map((org) => {
              const isActive = activeOrg?.id === org.id;
              return (
                <button
                  key={org.id}
                  onClick={() => handleSwitchOrg(org.id)}
                  className={cn(
                    'relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer',
                    isActive && 'bg-accent'
                  )}
                >
                  {isActive ? (
                    <Check className="size-3.5 text-primary" />
                  ) : (
                    <span className="size-3.5" />
                  )}
                  {org.name}
                </button>
              );
            })}

            <Separator className="my-1" />

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/organization/create');
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary outline-none transition-colors hover:bg-accent cursor-pointer"
            >
              <Plus className="size-3.5" />
              Create Organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
