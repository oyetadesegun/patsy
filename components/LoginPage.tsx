"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LogIn } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!login(username.toLowerCase(), password)) {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl border border-border shadow-elevated animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold">Patsy Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="admin or patsy"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <Button type="submit" className="w-full font-body h-11">
            Sign In
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider font-medium">
            Access Levels
          </p>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="text-center">
              <p className="text-[10px] font-bold text-foreground">admin</p>
              <p className="text-[10px] text-muted-foreground">Full Control</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-foreground">patsy</p>
              <p className="text-[10px] text-muted-foreground">Viewer Only</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
