import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import bitLogo from "@assets/bit_logo.png_1779374905037.png";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 font-bold text-lg hover:text-accent transition-colors">
              <img src={bitLogo} alt="BIT Logo" className="h-10 w-10 object-contain bg-white rounded-full p-0.5" />
              Bangalore Institute of Technology — Event Portal
            </Link>
          </div>
          
          <nav className="flex items-center gap-6">
            {user && (
              <>
                {user.role === 'student' && (
                  <>
                    <Link 
                      href="/" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${location === '/' ? 'text-accent' : 'text-primary-foreground/80'}`}
                    >
                      Events
                    </Link>
                    <Link 
                      href="/my-registrations" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${location === '/my-registrations' ? 'text-accent' : 'text-primary-foreground/80'}`}
                    >
                      My Registrations
                    </Link>
                  </>
                )}
                
                {user.role === 'faculty' && (
                  <>
                    <Link 
                      href="/faculty/dashboard" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${location === '/faculty/dashboard' ? 'text-accent' : 'text-primary-foreground/80'}`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/faculty/events/new" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${location === '/faculty/events/new' ? 'text-accent' : 'text-primary-foreground/80'}`}
                    >
                      Create Event
                    </Link>
                  </>
                )}
                
                {user.role === 'admin' && (
                  <>
                    <Link 
                      href="/admin/dashboard" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${location === '/admin/dashboard' ? 'text-accent' : 'text-primary-foreground/80'}`}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/admin/events" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${location.startsWith('/admin/events') ? 'text-accent' : 'text-primary-foreground/80'}`}
                    >
                      All Events
                    </Link>
                    <Link 
                      href="/admin/analytics" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${location.startsWith('/admin/analytics') ? 'text-accent' : 'text-primary-foreground/80'}`}
                    >
                      Analytics
                    </Link>
                    <Link 
                      href="/admin/reports" 
                      className={`text-sm font-medium transition-colors hover:text-accent ${location.startsWith('/admin/reports') ? 'text-accent' : 'text-primary-foreground/80'}`}
                    >
                      Reports
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-primary-foreground/20">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium leading-none">{user.name}</span>
                    <span className="text-xs text-primary-foreground/70">{user.role} • {user.department}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" data-testid="button-logout">
                    Logout
                  </Button>
                </div>
              </>
            )}
            {!user && (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-accent transition-colors">
                  Login
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="border-t py-6 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bangalore Institute of Technology, CSE-ICB Department.
        </div>
      </footer>
    </div>
  );
}
