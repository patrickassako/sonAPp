"use client";

import { useEffect, useState } from "react";
import { Bell, X, Check } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/client";
import { useTranslation } from "@/i18n/useTranslation";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationBanner() {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [denied, setDenied] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Don't show if push not supported
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
        // Don't show if already has subscription in localStorage
        if (localStorage.getItem("bimzik_push_subscription")) {
            setEnabled(true);
            return;
        }
        // Don't show if user dismissed it
        if (localStorage.getItem("bimzik_push_dismissed")) return;
        // Don't show if permission denied
        if (Notification.permission === "denied") {
            setDenied(true);
            return;
        }
        // Don't show if already granted (might have subscription elsewhere)
        if (Notification.permission === "granted") {
            // Try to get existing subscription
            navigator.serviceWorker.ready.then(async (reg) => {
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    localStorage.setItem("bimzik_push_subscription", JSON.stringify(sub.toJSON()));
                    setEnabled(true);
                } else {
                    setVisible(true);
                }
            });
            return;
        }
        setVisible(true);
    }, []);

    const handleEnable = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setDenied(true);
                setVisible(false);
                return;
            }

            const vapidRes = await fetch(`${API_BASE_URL}/api/v1/notifications/vapid-key`);
            const vapidData = await vapidRes.json();
            if (!vapidRes.ok) return;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidData.vapid_public_key),
            });

            localStorage.setItem("bimzik_push_subscription", JSON.stringify(subscription.toJSON()));
            setEnabled(true);
            setVisible(false);
        } catch (err) {
            console.error("Push subscription error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem("bimzik_push_dismissed", "1");
        setVisible(false);
    };

    if (denied) {
        return (
            <div className="mx-4 md:mx-0 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                <Bell className="w-4 h-4 shrink-0" />
                <span className="flex-1">{t("dashboardLayout.pushBannerDenied")}</span>
            </div>
        );
    }

    if (enabled) return null;
    if (!visible) return null;

    return (
        <div className="mx-4 md:mx-0 mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20">
            <Bell className="w-4 h-4 text-primary shrink-0" />
            <span className="flex-1 text-sm text-white/80">{t("dashboardLayout.pushBanner")}</span>
            <button
                onClick={handleEnable}
                disabled={loading}
                className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
                {loading ? "..." : t("dashboardLayout.pushBannerButton")}
            </button>
            <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 shrink-0">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
