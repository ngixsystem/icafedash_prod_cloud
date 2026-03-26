import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X, Upload, Eye, EyeOff, Link, GripVertical } from "lucide-react";
import { api, type AdminBanner } from "@/lib/api";

// ─── Edit / Create Modal ─────────────────────────

interface BannerFormProps {
  banner: AdminBanner | null; // null = create
  onClose: () => void;
}

function BannerFormModal({ banner, onClose }: BannerFormProps) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(banner?.title ?? "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.link_url ?? "");
  const [sortOrder, setSortOrder] = useState(banner?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(banner?.is_active ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(banner?.image_url ?? null);

  const createMut = useMutation({
    mutationFn: (fd: FormData) => api.adminCreateBanner(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_banners"] });
      toast.success("Баннер создан");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (fd: FormData) => api.adminUpdateBanner(banner!.id, fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_banners"] });
      toast.success("Баннер обновлён");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) return toast.error("Введите заголовок");
    if (!banner && !imageFile) return toast.error("Выберите изображение");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("subtitle", subtitle.trim());
    fd.append("link_url", linkUrl.trim());
    fd.append("sort_order", String(sortOrder));
    fd.append("is_active", String(isActive));
    if (imageFile) fd.append("image", imageFile);

    if (banner) {
      updateMut.mutate(fd);
    } else {
      createMut.mutate(fd);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0e1427] border border-white/10 rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white text-lg">
            {banner ? "Редактировать баннер" : "Новый баннер"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Изображение</label>
          {imagePreview ? (
            <div className="relative w-full h-[140px] rounded-xl overflow-hidden border border-white/10">
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-lg flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-[140px] rounded-xl border-2 border-dashed border-white/10 bg-black/20 cursor-pointer hover:border-[#00E5FF]/40 transition-colors">
              <Upload className="w-8 h-8 text-slate-500 mb-2" />
              <span className="text-xs text-slate-500">Нажмите для загрузки</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Заголовок</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Турнирный сезон"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#00E5FF]/50 transition-colors"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Подзаголовок</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="CS2 / Dota 2 / Valorant"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#00E5FF]/50 transition-colors"
          />
        </div>

        {/* Link URL */}
        <div>
          <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">
            Ссылка <span className="text-slate-600">(необязательно)</span>
          </label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#00E5FF]/50 transition-colors"
          />
        </div>

        {/* Sort order + Active */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Порядок</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]/50 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Статус</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                isActive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isActive ? "Активен" : "Скрыт"}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-gradient-to-r from-[#00E5FF] to-[#6C5CE7] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm uppercase tracking-wider"
        >
          {isPending ? "Сохранение..." : banner ? "Сохранить" : "Создать баннер"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Panel ─────────────────────────

export default function BannerPanel() {
  const qc = useQueryClient();
  const [modalBanner, setModalBanner] = useState<AdminBanner | null | "new">(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin_banners"],
    queryFn: api.adminBanners,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.adminDeleteBanner(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_banners"] });
      toast.success("Баннер удалён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Баннеры</h2>
          <p className="text-sm text-slate-400 mt-1">
            Управление баннерами на главной странице FRAG.GG
          </p>
        </div>
        <button
          onClick={() => setModalBanner("new")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#6C5CE7] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="glass-card !bg-white/5 rounded-2xl p-12 text-center border border-white/10">
          <p className="text-slate-400">Баннеров пока нет</p>
          <button
            onClick={() => setModalBanner("new")}
            className="mt-4 text-[#00E5FF] hover:underline text-sm font-medium"
          >
            Создать первый баннер
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="glass-card !bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors group"
            >
              {/* Image preview */}
              <div className="relative h-[130px]">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e1427] via-[#0e1427]/40 to-transparent" />

                {/* Status badge */}
                {!banner.is_active && (
                  <span className="absolute top-3 left-3 bg-red-500/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Скрыт
                  </span>
                )}
                {banner.is_active && (
                  <span className="absolute top-3 left-3 bg-emerald-500/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Активен
                  </span>
                )}

                {/* Title overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-bold text-white text-base leading-tight truncate">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-xs text-slate-300 mt-0.5 truncate">{banner.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mr-auto">
                  <GripVertical className="w-3.5 h-3.5" />
                  <span>#{banner.sort_order}</span>
                  {banner.link_url && (
                    <a
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#00E5FF] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link className="w-3 h-3" />
                      ссылка
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setModalBanner(banner)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#00E5FF] hover:border-[#00E5FF]/30 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Удалить этот баннер?")) deleteMut.mutate(banner.id);
                  }}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalBanner !== null && (
        <BannerFormModal
          banner={modalBanner === "new" ? null : modalBanner}
          onClose={() => setModalBanner(null)}
        />
      )}
    </div>
  );
}
