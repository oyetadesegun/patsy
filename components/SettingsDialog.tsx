"use client"
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, X, RotateCcw, Plus } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export function SettingsDialog() {
  const {
    clothTypes, sizes,
    addClothType, removeClothType,
    addSize, removeSize,
    resetClothTypes, resetSizes,
  } = useSettings();

  const [newType, setNewType] = useState("");
  const [newSize, setNewSize] = useState("");
  const [tab, setTab] = useState<"types" | "sizes">("types");

  const handleAddType = () => {
    if (newType.trim()) {
      addClothType(newType.trim());
      setNewType("");
    }
  };

  const handleAddSize = () => {
    if (newSize.trim()) {
      addSize(newSize.trim());
      setNewSize("");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Manage Types & Sizes"
        >
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Manage Types & Sizes</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 shrink-0">
          {(["types", "sizes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                tab === t ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "types" ? "Cloth Types" : "Sizes"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 py-1">
          {tab === "types" ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddType()}
                  placeholder="Add new type (e.g. Kaftan)"
                  className="flex-1 text-sm"
                />
                <Button size="sm" onClick={handleAddType} disabled={!newType.trim()} className="shrink-0 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {clothTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 bg-muted text-foreground text-xs font-medium rounded-full px-3 py-1.5"
                  >
                    {type}
                    <button
                      onClick={() => removeClothType(type)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={resetClothTypes}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to defaults
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSize()}
                  placeholder="Add new size (e.g. 62, XL)"
                  className="flex-1 text-sm"
                />
                <Button size="sm" onClick={handleAddSize} disabled={!newSize.trim()} className="shrink-0 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-1.5 bg-muted text-foreground text-xs font-bold rounded-full px-3 py-1.5"
                  >
                    {size}
                    <button
                      onClick={() => removeSize(size)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={resetSizes}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to defaults
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
