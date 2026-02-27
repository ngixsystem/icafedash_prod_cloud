import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Upload, MapPin, Clock, Wifi, LayoutGrid, DollarSign, Save, CloudDownload, Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Zone {
    name: string;
    specs: string;
    price: string;
    capacity: string;
}

interface Tariff {
    duration: string;
    price: string;
}

const SettingsPanel = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        club_name: "",
        address: "",
        working_hours: "",
        internet_speed: "",
    });

    const [zones, setZones] = useState<Zone[]>([]);
    const [tariffs, setTariffs] = useState<Tariff[]>([]);

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
            });
            setLogoPreview(config.club_logo_url || null);

            // Parse zones
            try {
                if (config.zones && config.zones.trim().startsWith("[")) {
                    setZones(JSON.parse(config.zones));
                } else {
                    setZones([]);
                }
            } catch (e) {
                console.error("Failed to parse zones", e);
                setZones([]);
            }

            // Parse tariffs
            try {
                if (config.tariffs && config.tariffs.trim().startsWith("[")) {
                    setTariffs(JSON.parse(config.tariffs));
                } else {
                    setTariffs([]);
                }
            } catch (e) {
                console.error("Failed to parse tariffs", e);
                setTariffs([]);
            }
        }
    }, [config]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleZoneChange = (index: number, field: keyof Zone, value: string) => {
        const newZones = [...zones];
        newZones[index][field] = value;
        setZones(newZones);
    };

    const addZone = () => {
        setZones([...zones, { name: "", specs: "", price: "", capacity: "" }]);
    };

    const removeZone = (index: number) => {
        setZones(zones.filter((_, i) => i !== index));
    };

    const handleTariffChange = (index: number, field: keyof Tariff, value: string) => {
        const newTariffs = [...tariffs];
        newTariffs[index][field] = value;
        setTariffs(newTariffs);
    };

    const addTariff = () => {
        setTariffs([...tariffs, { duration: "", price: "" }]);
    };

    const removeTariff = (index: number) => {
        setTariffs(tariffs.filter((_, i) => i !== index));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith("image/")) {
                toast.error("Пожалуйста, загрузите изображение (JPG/PNG)");
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setLogoPreview(objectUrl);

            return () => URL.revokeObjectURL(objectUrl);
        }
    };

    const loadIcafeDataMutation = useMutation({
        mutationFn: api.getIcafeData,
        onSuccess: (data) => {
            try {
                if (data.zones && data.zones !== "[]") {
                    setZones(JSON.parse(data.zones));
                }
                if (data.tariffs && data.tariffs !== "[]") {
                    setTariffs(JSON.parse(data.tariffs));
                }
                toast.success("Данные успешно загружены из iCafeCloud");
            } catch (e) {
                toast.error("Ошибка парсинга данных из iCafeCloud");
            }
        },
        onError: () => {
            toast.error("Ошибка при загрузке данных из iCafeCloud");
        }
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            let finalLogoUrl = config?.club_logo_url || "";

            if (selectedFile) {
                const uploadRes = await api.uploadLogo(selectedFile);
                finalLogoUrl = uploadRes.url;
            }

            return api.saveConfig({
                ...formData,
                zones: JSON.stringify(zones),
                tariffs: JSON.stringify(tariffs),
                club_logo_url: finalLogoUrl,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["config"] });
            toast.success("Настройки успешно сохранены!");
            setSelectedFile(null);
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

                {/* Zones Section */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-primary" /> Залы и Зоны</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Добавьте зоны клуба. Можно также загрузить предзаполненные группы ПК из iCafeCloud.
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

                    <div className="space-y-4">
                        {zones.map((zone, index) => (
                            <div key={index} className="flex flex-col gap-4 p-4 border border-border rounded-lg bg-background/50 relative">
                                <button type="button" onClick={() => removeZone(index)} className="absolute top-4 right-4 text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                                    <div className="space-y-2">
                                        <Label>Название зоны</Label>
                                        <Input value={zone.name} onChange={(e) => handleZoneChange(index, "name", e.target.value)} placeholder="Standard, VIP..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Характеристики ПК (CPU / GPU / RAM)</Label>
                                        <Input value={zone.specs} onChange={(e) => handleZoneChange(index, "specs", e.target.value)} placeholder="RTX 4070 / i7 / 32GB..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Цена в час</Label>
                                        <Input value={zone.price} onChange={(e) => handleZoneChange(index, "price", e.target.value)} placeholder="Например: 15000" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Вместимость ПК</Label>
                                        <Input value={zone.capacity} onChange={(e) => handleZoneChange(index, "capacity", e.target.value)} placeholder="Кол-во ПК в зоне" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addZone}
                            className="w-full py-3 border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors rounded-lg flex items-center justify-center gap-2 font-medium"
                        >
                            <Plus className="w-4 h-4" /> Добавить зону
                        </button>
                    </div>
                </div>

                {/* Tariffs Section */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-primary" /> Тарифные планы</h3>
                        <p className="text-sm text-muted-foreground">
                            Укажите основные пакеты и их стоимость для отображения на сайте.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tariffs.map((tariff, index) => (
                            <div key={index} className="flex gap-4 p-4 border border-border rounded-lg bg-background/50 relative items-end">
                                <div className="flex-1 space-y-2">
                                    <Label>Пакет / Длительность</Label>
                                    <Input value={tariff.duration} onChange={(e) => handleTariffChange(index, "duration", e.target.value)} placeholder="3 часа, Пакет Ночь..." />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Label>Цена</Label>
                                    <Input value={tariff.price} onChange={(e) => handleTariffChange(index, "price", e.target.value)} placeholder="Например: 45000" />
                                </div>
                                <button type="button" onClick={() => removeTariff(index)} className="text-destructive hover:bg-destructive/10 p-2.5 rounded-md transition-colors mb-[1px]">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addTariff}
                        className="w-full py-3 border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors rounded-lg flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus className="w-4 h-4" /> Добавить пакет
                    </button>
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
