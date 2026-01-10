import { useState } from 'react';
import { Card, Input, Button, Label, Spinner } from '@objectos/ui';
import { useAuth } from '../context/AuthContext';
import { Database } from 'lucide-react';

export default function Login() {
    const { signIn, signUp } = useAuth();
    const [isSignIn, setIsSignIn] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignIn) {
                await signIn(email, password);
            } else {
                await signUp(email, password, name);
            }
            // App component handles redirection via auth state change
        } catch (err: any) {
            console.error(err);
            setError(err.message || err.error?.message || 'Authentication failed');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col justify-center items-center p-4 bg-white relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[#FAFAFC]"></div>
            
            <div className="z-10 w-full max-w-[400px] animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg">
                            <Database className="w-6 h-6" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {isSignIn ? 'Welcome back' : 'Create account'}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-2">
                       {isSignIn ? 'Enter your details to access your workspace' : 'Start your journey with ObjectQL'}
                    </p>
                </div>

                <Card className="p-6 shadow-xl border-border/50 bg-background/50 backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isSignIn && (
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input 
                                    id="name"
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="Jane Doe"
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input 
                                id="email"
                                type="email"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                placeholder="name@example.com"
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input 
                                id="password"
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                placeholder="••••••••"
                                required 
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <span className="flex items-center gap-2"><Spinner className="w-4 h-4" /> Processing</span> : (isSignIn ? 'Sign in' : 'Create account')}
                        </Button>
                    </form>
                </Card>

                <div className="mt-8 text-center text-sm">
                    <span className="text-muted-foreground">{isSignIn ? "New to ObjectQL? " : "Already have an account? "}</span>
                    <button 
                        type="button"
                        onClick={() => { setIsSignIn(!isSignIn); setError(''); }}
                        className="font-medium text-[#0071e3] hover:text-[#0077ED] transition-colors"
                    >
                        {isSignIn ? "Sign up now" : "Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
