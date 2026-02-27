import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Upload, MapPin, Clock, Wifi, LayoutGrid, DollarSign, Save, CloudDownload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SettingsPanel = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        club_name: "",
        address: "",
        working_hours: "",
        internet_speed: "",
        zones: "",
        tariffs: "",
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const { data: config, isLoading } = useQuery({
        queryKey: ["config"],
        queryFn: api.getConfig,
    });

    useEffect(() => {
        if (config) {
            setFormData({
                club_name: config.club_name || "",
                address: config.address || "",
                working_hours: config.working_hours || "",
                internet_speed: config.internet_speed || "",
                zones: config.zones || "",
                tariffs: config.tariffs || "",
            });
            setLogoPreview(config.club_logo_url || null);
        }
    }, [config]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Only allow images
            if (!file.type.startsWith("image/")) {
                toast.error("Пожалуйста, загрузите изображение (JPG/PNG)");
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setLogoPreview(objectUrl);

            // Free memory when component unmounts
            return () => URL.revokeObjectURL(objectUrl);
        }
    };

    const loadIcafeDataMutation = useMutation({
        mutationFn: api.getIcafeData,
        onSuccess: (data) => {
            setFormData(prev => ({
                ...prev,
                zones: data.zones || prev.zones,
                tariffs: data.tariffs || prev.tariffs
            }));
            toast.success("Данные успешно загружены из iCafeCloud");
        },
        onError: () => {
            toast.error("Ошибка при загрузке данных из iCafeCloud");
        }
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            let finalLogoUrl = config?.club_logo_url || "";

            // 1. Upload new logo if selected
            if (selectedFile) {
                const uploadRes = await api.uploadLogo(selectedFile);
                finalLogoUrl = uploadRes.url;
            }

            // 2. Save all config data
            return api.saveConfig({
                ...formData,
                club_logo_url: finalLogoUrl,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["config"] });
            toast.success("Настройки успешно сохранены!");
            setSelectedFile(null); // Reset file selection after successful save
        },
        onError: (error) => {
            console.error(error);
            toast.error("Ошибка при сохранении настроек.");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Настройки клуба</h2>
                <p className="text-muted-foreground mt-2">
                    Управляйте публичной информацией, конфигурацией оборудования и тарифами вашего клуба. Эти данные будут отображаться на странице клуба для клиентов.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Photo Upload Section */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"> Фотографии и логотип</h3>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-48 h-48 shrink-0 rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border flex items-center justify-center relative group">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Предпросмотр" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">Загрузить JPG/PNG</span>
                                </div>
                            )}

                            <label htmlFor="photo-upload" className={`absolute inset-0 bg-background/80 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm`}>
                                <Upload className="w-8 h-8 mb-2 text-primary" />
                                <span className="text-sm font-medium">Изменить</span>
                            </label>
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label htmlFor="club_name">Название клуба</Label>
                            <Input
                                id="club_name"
                                name="club_name"
                                value={formData.club_name}
                                onChange={handleChange}
                                placeholder="Пример: CyberX Arena"
                                required
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Логотип должен быть квадратным для правильного отображения. Идеальный размер: 512x512 пикселей.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Basic Info Section */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm grid gap-6 md:grid-cols-2">
                    <div className="col-span-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"> Основная информация</h3>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address" className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> Адрес</Label>
                        <Input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="г. Москва, ул. Пушкина, 10"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="working_hours" className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> Время работы</Label>
                        <Input
                            id="working_hours"
                            name="working_hours"
                            value={formData.working_hours}
                            onChange={handleChange}
                            placeholder="Круглосуточно (24/7)"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="internet_speed" className="flex items-center gap-2"><Wifi className="w-4 h-4 text-muted-foreground" /> Скорость интернета</Label>
                        <Input
                            id="internet_speed"
                            name="internet_speed"
                            value={formData.internet_speed}
                            onChange={handleChange}
                            placeholder="Например: 1000 Мбит/с"
                        />
                    </div>
                </div>

                {/* Zones & Tariffs */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-primary" /> Описание залов и тарифов</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Опишите зоны или нажмите кнопку, чтобы скопировать данные напрямую из iCafeCloud.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => loadIcafeDataMutation.mutate()}
                            disabled={loadIcafeDataMutation.isPending}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-medium rounded-lg text-sm disabled:opacity-50 shrink-0"
                        >
                            {loadIcafeDataMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <CloudDownload className="w-4 h-4" />
                            )}
                            Загрузить из iCafeCloud
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zones" className="flex items-center gap-2 font-medium mb-2">Залы и Зоны</Label>
                        <Textarea
                            id="zones"
                            name="zones"
                            value={formData.zones}
                            onChange={handleChange}
                            placeholder="Standard: RTX 3060, монитор 144Hz. VIP: RTX 4070..."
                            className="min-h-[120px]"
                        />
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border">
                        <Label htmlFor="tariffs" className="flex items-center gap-2 font-medium mb-2"><DollarSign className="w-4 h-4 text-muted-foreground" /> Тарифы</Label>
                        <Textarea
                            id="tariffs"
                            name="tariffs"
                            value={formData.tariffs}
                            onChange={handleChange}
                            placeholder="1 час - 100 руб, Пакет 'Ночь' - 500 руб..."
                            className="min-h-[120px]"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 pb-8">
                    <button
                        type="submit"
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium rounded-lg shadow-sm disabled:opacity-50"
                    >
                        {saveMutation.isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        Сохранить настройки
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPanel;
