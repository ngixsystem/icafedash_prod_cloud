import { Search, Bell, Settings, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const SettingsModal = ({ onClose }: { onClose: () => void }) => {
  const qc = useQueryClient();
  const { data: cfg } = useQuery({ queryKey: ["config"], queryFn: api.getConfig });

  const [clubName, setClubName] = useState("");
  const [clubLogo, setClubLogo] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form when data loads
  useState(() => {
    if (cfg) {
      setClubName(cfg.club_name);
      setClubLogo(cfg.club_logo_url);
    }
  });

  const save = useMutation({
    mutationFn: () => api.saveConfig({
      club_name: clubName,
      club_logo_url: clubLogo
    }),
    onSuccess: () => {
      qc.invalidateQueries();
      onClose();
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { url } = await api.uploadLogo(file);
      setClubLogo(url);
    } catch (err) {
      alert("Ошибка при загрузке логотипа");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Настройки брендинга</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Read-only API Info */}
          <div className="p-3 bg-secondary/50 rounded-lg border border-border space-y-2">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Параметры API (Только чтение)</span>
              <Settings className="h-3 w-3" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cafe ID:</span>
                <span className="font-mono text-foreground">{cfg?.cafe_id || "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">API Key:</span>
                <span className="font-mono text-primary">{cfg?.api_key_masked || "—"}</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/60 italic leading-tight">
              * Измените <code>config.json</code> на сервере для обновления ключей.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Название клуба</label>
              <input
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="Напр. TeamPro"
                className="w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Логотип клуба (512x512)</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl border border-border bg-secondary overflow-hidden flex items-center justify-center flex-shrink-0">
                  {clubLogo ? (
                    <img src={clubLogo} alt="Preview" className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {clubName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 rounded-lg bg-secondary border border-border text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors">
                    {isUploading ? "Загрузка..." : "Выбрать файл"}
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                  <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
                    PNG, JPG или WebP. Рекомендуем 512x512.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-secondary py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || isUploading}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {save.isPending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
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
