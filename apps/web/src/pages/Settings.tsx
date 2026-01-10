import { Card, Input, Label, Button } from '@objectos/ui';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
    const { user, signOut } = useAuth();

    return (
        <div className="p-6 max-w-2xl mx-auto w-full">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
            
            <Card className="p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                <div className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={user?.name || ''} disabled />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" value={user?.email || ''} disabled />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="id">User ID</Label>
                        <Input id="id" value={user?.id || ''} disabled className="font-mono text-xs" />
                    </div>
                </div>
            </Card>

            <Card className="p-6 border-destructive/20">
                <h2 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Sign out of your account on this device.
                </p>
                <Button variant="destructive" onClick={() => signOut()}>
                    Sign Out
                </Button>
            </Card>
        </div>
    );
}
