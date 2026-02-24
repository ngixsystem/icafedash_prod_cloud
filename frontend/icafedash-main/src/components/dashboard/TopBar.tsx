import { Search, Bell, Settings, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const qc = useQueryClient();
  const { data: cfg } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });

  const [apiKey, setApiKey] = useState("");
  const [cafeId, setCafeId] = useState(cfg?.cafe_id ?? "");

  const save = useMutation({
    mutationFn: () => api.saveConfig(apiKey, cafeId),
    onSuccess: () => {
      qc.invalidateQueries();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Настройки API</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Cafe ID
            </label>
            <input
              value={cafeId}
              onChange={(e) => setCafeId(e.target.value)}
              placeholder={cfg?.cafe_id || "Введите Cafe ID"}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              API Key
              {cfg?.api_key_masked && (
                <span className="ml-2 text-xs text-primary">Текущий: {cfg.api_key_masked}</span>
              )}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Введите новый API ключ"
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Settings → API Settings → Create в панели iCafeCloud
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-secondary py-2 text-sm text-foreground hover:bg-card transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || (!apiKey && !cafeId)}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {save.isPending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>

        {cfg?.configured && (
          <p className="text-center text-xs text-success mt-3">✓ API подключено</p>
        )}
      </div>
    </div>
  );
};

const TopBar = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-4 py-4 lg:px-6">
        <h1 className="text-xl font-bold text-foreground pl-10 lg:pl-0">Обзор</h1>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Поиск..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-32 lg:w-48"
            />
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-lg bg-card border border-border p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Настройки API"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button className="rounded-lg bg-card border border-border p-2 text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              АК
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-foreground">Админ</p>
              <p className="text-xs text-muted-foreground">Управляющий</p>
            </div>
          </div>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};

export default TopBar;
