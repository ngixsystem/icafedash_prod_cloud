import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface ClubEditModalProps {
    club: any;
    isOpen: boolean;
    onClose: () => void;
}

export function ClubEditModal({ club, isOpen, onClose }: ClubEditModalProps) {
    const qc = useQueryClient();
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (club) {
            setFormData({
                name: club.name || "",
                address: club.address || "",
                phone: club.phone || "",
                logo_url: club.logo_url || "",
                instagram: club.instagram || "",
                working_hours: club.working_hours || "",
                cafe_id: club.cafe_id || "",
                api_key: club.api_key || "",
            });
        }
    }, [club]);

    const updateClub = useMutation({
        mutationFn: (data: any) => api.updateClub(club.id, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["admin", "clubs"] });
            toast.success("Данные клуба успешно обновлены");
            onClose();
        },
        onError: (err: any) => {
            console.error("Update club error:", err);
            toast.error("Ошибка при обновлении клуба: " + (err.message || ""));
        }
    });

    if (!club) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Редактирование: {club.name}</DialogTitle>
                    <DialogDescription>
                        Вы можете изменить информацию о клубе, которая будет показана в приложении.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Название</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right">Адрес</Label>
                        <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="col-span-3 resize-none" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">Телефон</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="col-span-3" placeholder="+998..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="logo" className="text-right">URL Лого/Фото</Label>
                        <Input id="logo" value={formData.logo_url} onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} className="col-span-3" placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="inst" className="text-right">Instagram</Label>
                        <Input id="inst" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} className="col-span-3" placeholder="@username" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="hours" className="text-right">Время работы</Label>
                        <Input id="hours" value={formData.working_hours} onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })} className="col-span-3" placeholder="Круглосуточно / 09:00 - 23:00" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cafe_id" className="text-right">License ID</Label>
                        <Input id="cafe_id" value={formData.cafe_id} onChange={(e) => setFormData({ ...formData, cafe_id: e.target.value })} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Координаты</Label>
                        <div className="col-span-3 flex gap-2">
                            <Input placeholder="Широта (Lat)" value={formData.lat || ""} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} />
                            <Input placeholder="Долгота (Lng)" value={formData.lng || ""} onChange={(e) => setFormData({ ...formData, lng: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="api_key" className="text-right">API Key</Label>
                        <Input id="api_key" type="password" value={formData.api_key} onChange={(e) => setFormData({ ...formData, api_key: e.target.value })} className="col-span-3" placeholder="Оставьте пустым, если не меняется" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Отмена</Button>
                    <Button onClick={() => updateClub.mutate(formData)} disabled={updateClub.isPending}>
                        Сохранить изменения
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
