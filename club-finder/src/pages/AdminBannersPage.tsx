import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Pencil, GripVertical, Link, Eye, EyeOff, X, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdminBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, type AdminBannerData } from "@/hooks/use-banners";
import { useToast } from "@/components/ui/use-toast";

export default function AdminBannersPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { toast } = useToast();
  const { data: banners = [], isLoading } = useAdminBanners(token);
  const createBanner = useCreateBanner(token);
  const updateBanner = useUpdateBanner(token);
  const deleteBanner = useDeleteBanner(token);

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdminBannerData | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!user || user.role !== "admin") {
    return (
      <div className="h-screen flex items-center justify-center text-[#949BA4]">
        <p>Доступ запрещён</p>
      </div>
    );
  }

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setLinkUrl("");
    setSortOrder(0);
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setEditingBanner(null);
    setShowForm(false);
  };

  const openEditForm = (banner: AdminBannerData) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setLinkUrl(banner.link_url);
    setSortOrder(banner.sort_order);
    setIsActive(banner.is_active);
    setImageFile(null);
    setImagePreview(banner.image_url);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: "Введите заголовок", variant: "destructive" });
      return;
    }
    if (!editingBanner && !imageFile) {
      toast({ title: "Выберите изображение", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("subtitle", subtitle.trim());
    formData.append("link_url", linkUrl.trim());
    formData.append("sort_order", String(sortOrder));
    formData.append("is_active", String(isActive));
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      if (editingBanner) {
        await updateBanner.mutateAsync({ id: editingBanner.id, formData });
        toast({ title: "Баннер обновлён" });
      } else {
        await createBanner.mutateAsync(formData);
        toast({ title: "Баннер создан" });
      }
      resetForm();
    } catch (err: any) {
      toast({ title: err.message || "Ошибка", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteBanner.mutateAsync(id);
      toast({ title: "Баннер удалён" });
    } catch {
      toast({ title: "Ошибка при удалении", variant: "destructive" });
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col antialiased">
      <header className="flex items-center gap-3 px-5 pt-8 pb-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-[#1E1F22] rounded-xl flex items-center justify-center border border-[#2F3136] text-[#949BA4] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-xl font-bold uppercase tracking-wide">Баннеры</h1>
        <div className="flex-1" />
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="w-10 h-10 bg-[#F5A623] rounded-xl flex items-center justify-center text-black hover:bg-[#F5A623]/80 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-5">
        {showForm && (
          <div className="mb-6 rounded-2xl border border-[#2F3136] bg-[#1E1F22] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#F5A623]">
                {editingBanner ? "Редактировать" : "Новый баннер"}
              </h2>
              <button onClick={resetForm} className="text-[#949BA4] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs text-[#949BA4] mb-1.5 uppercase tracking-wider">Изображение</label>
              {imagePreview ? (
                <div className="relative w-full h-[120px] rounded-xl overflow-hidden border border-[#2F3136] mb-2">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-lg flex items-center justify-center text-white hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-[120px] rounded-xl border-2 border-dashed border-[#2F3136] bg-[#18191C] cursor-pointer hover:border-[#F5A623]/50 transition-colors">
                  <Upload className="w-8 h-8 text-[#949BA4] mb-2" />
                  <span className="text-xs text-[#949BA4]">Нажмите для загрузки</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs text-[#949BA4] mb-1.5 uppercase tracking-wider">Заголовок</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Турнирный сезон"
                className="w-full bg-[#18191C] border border-[#2F3136] rounded-xl px-4 py-3 text-sm text-white placeholder-[#949BA4] outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-xs text-[#949BA4] mb-1.5 uppercase tracking-wider">Подзаголовок</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="CS2 / Dota 2 / Valorant"
                className="w-full bg-[#18191C] border border-[#2F3136] rounded-xl px-4 py-3 text-sm text-white placeholder-[#949BA4] outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>

            {/* Link URL */}
            <div>
              <label className="block text-xs text-[#949BA4] mb-1.5 uppercase tracking-wider">Ссылка (необязательно)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-[#18191C] border border-[#2F3136] rounded-xl px-4 py-3 text-sm text-white placeholder-[#949BA4] outline-none focus:border-[#F5A623] transition-colors"
              />
            </div>

            {/* Sort order + Active */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-[#949BA4] mb-1.5 uppercase tracking-wider">Порядок</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full bg-[#18191C] border border-[#2F3136] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#F5A623] transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-[#949BA4] mb-1.5 uppercase tracking-wider">Статус</label>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium border transition-colors ${
                    isActive
                      ? "bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F5A623]"
                      : "bg-[#18191C] border-[#2F3136] text-[#949BA4]"
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
              disabled={createBanner.isPending || updateBanner.isPending}
              className="w-full bg-[#F5A623] text-black font-bold py-3 rounded-xl hover:bg-[#F5A623]/80 transition-colors disabled:opacity-50 uppercase tracking-wider text-sm"
            >
              {createBanner.isPending || updateBanner.isPending
                ? "Сохранение..."
                : editingBanner ? "Сохранить" : "Создать"}
            </button>
          </div>
        )}

        {/* Banner list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[#1E1F22] border border-[#2F3136] animate-pulse" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="rounded-2xl border border-[#2F3136] bg-[#1E1F22] p-8 text-center text-[#949BA4]">
            Баннеров пока нет
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="relative rounded-2xl border border-[#2F3136] bg-[#1E1F22] overflow-hidden">
                {/* Preview */}
                <div className="relative h-[110px]">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#121315]/80 via-[#121315]/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121315]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 z-10">
                    <h3 className="font-display text-lg font-bold uppercase text-white leading-tight">{banner.title}</h3>
                    {banner.subtitle && <p className="text-xs text-[#D3D7DE]">{banner.subtitle}</p>}
                  </div>
                  {!banner.is_active && (
                    <div className="absolute top-2 left-2 bg-red-500/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Скрыт
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#2F3136]">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#949BA4] mr-auto">
                    <GripVertical className="w-3.5 h-3.5" />
                    <span>#{banner.sort_order}</span>
                    {banner.link_url && (
                      <span className="flex items-center gap-1 text-[#F5A623]">
                        <Link className="w-3 h-3" />
                        ссылка
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openEditForm(banner)}
                    className="w-8 h-8 rounded-lg bg-[#18191C] border border-[#2F3136] flex items-center justify-center text-[#949BA4] hover:text-[#F5A623] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="w-8 h-8 rounded-lg bg-[#18191C] border border-[#2F3136] flex items-center justify-center text-[#949BA4] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
