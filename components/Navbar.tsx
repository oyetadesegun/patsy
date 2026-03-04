"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ShoppingCart, Package, LogIn, LogOut, User } from "lucide-react";

function LoginDialog({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (login(username.toLowerCase(), password)) {
      onClose();
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="nav-username">Username</Label>
        <Input
          id="nav-username"
          type="text"
          placeholder="admin or patsy"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nav-password">Password</Label>
        <Input
          id="nav-password"
          type="password"
          placeholder="••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" className="w-full font-body">Sign In</Button>
    </form>
  );
}

export function Navbar() {
  const { user, role, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [loginOpen, setLoginOpen] = useState(false);

  const isAdmin = role === "admin";
  const canSell = role === "admin" || role === "staff";

  const navLinks = [
    { href: "/", label: "Shop", icon: ShoppingBag, always: true },
    { href: "/pos", label: "Sell", icon: ShoppingCart, show: canSell },
    { href: "/inventory", label: "Inventory", icon: Package, show: isAdmin },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="font-display font-bold text-lg tracking-tight text-foreground">
          Patsy<span className="text-primary">.</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon, always, show }) => {
            if (!always && !show) return null;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium font-body transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-body text-foreground">{user}</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold h-5">
                  {role}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5 font-body text-xs">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 font-body text-xs">
                  <LogIn className="h-3.5 w-3.5" />
                  Staff Login
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-display">Staff Sign In</DialogTitle>
                </DialogHeader>
                <LoginDialog onClose={() => setLoginOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </nav>
  );
}
