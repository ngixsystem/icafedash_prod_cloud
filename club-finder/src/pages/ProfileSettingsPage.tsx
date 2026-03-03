import { useRef, useState } from "react";
import { ArrowLeft, Camera, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { token, user, updateUser } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onPickAvatar = () => {
    fileRef.current?.click();
  };

  const onUploadAvatar = async (file: File) => {
    if (!token) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch("/api/public/profile/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed to upload avatar");
      updateUser({ avatar_url: data.avatar_url || "" });
      toast.success("Аватар обновлен");
    } catch (err: any) {
      toast.error(err?.message || "Не удалось обновить аватар");
    } finally {
      setIsUploading(false);
    }
  };

  const onChangePassword = async () => {
    if (!token) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Заполните все поля пароля");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Новый пароль и подтверждение не совпадают");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Новый пароль должен быть минимум 6 символов");
      return;
    }

    setIsSavingPassword(true);
    try {
      const resp = await fetch("/api/public/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || "Failed to change password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Пароль успешно обновлен");
    } catch (err: any) {
      toast.error(err?.message || "Не удалось сменить пароль");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="w-9 h-9 rounded-full glass flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-display font-bold">Настройки профиля</h1>
      </div>

      <div className="mx-4 rounded-lg glass p-4 mb-4">
        <h2 className="text-sm font-semibold mb-3">Аватар</h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-primary overflow-hidden flex items-center justify-center font-bold text-xl uppercase">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              user?.username?.[0] || "?"
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={onPickAvatar}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              <Camera className="w-4 h-4" /> {isUploading ? "Загрузка..." : "Загрузить аватар"}
            </button>
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG, JPEG, WEBP, GIF</p>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadAvatar(file);
            e.currentTarget.value = "";
          }}
        />
      </div>

      <div className="mx-4 rounded-lg glass p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> Смена пароля
        </h2>
        <div className="space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Текущий пароль"
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Новый пароль"
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Повторите новый пароль"
            className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
          />
          <button
            type="button"
            onClick={onChangePassword}
            disabled={isSavingPassword}
            className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60"
          >
            {isSavingPassword ? "Сохранение..." : "Сменить пароль"}
          </button>
        </div>
      </div>
    </div>
  );
}

