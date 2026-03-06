"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuditTrailPage() {
  const { role, isAuthenticated } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    if (isAuthenticated && role !== "admin") {
      router.replace("/");
    }
  }, [isAuthenticated, role, router]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const url = filterAction !== "all" 
        ? `/api/audit?action=${filterAction}` 
        : "/api/audit";
      const response = await fetch(url);
      const data = await response.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role === "admin") {
      fetchLogs();
    }
  }, [isAuthenticated, role, filterAction]);

  if (!isAuthenticated || role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">Detailed record of all system activities</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Download className="h-4 w-4" />
          Export / Print
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9" />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="ITEM_ADD">Item Added</SelectItem>
            <SelectItem value="ITEM_UPDATE">Item Updated</SelectItem>
            <SelectItem value="ITEM_DELETE">Item Deleted</SelectItem>
            <SelectItem value="SALE_COMPLETE">Sale Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="max-w-xs">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading logs...</TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">No logs found</TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      log.action.includes("SALE") ? "bg-green-100 text-green-700" : 
                      log.action.includes("DELETE") ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {log.action.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium">{log.performedBy}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.entityType}</TableCell>
                  <TableCell className="text-[10px] font-mono whitespace-pre-wrap max-w-sm">
                    {JSON.stringify(log.details, null, 2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
