"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  Infinity,
  Check,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  Smartphone,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { API_BASE_URL } from "@/lib/api/client";
import type {
  Country,
  CreditPackage,
  PaymentMethod,
  PaymentStep,
  CustomerInfo,
  InitiatePaymentResponse,
  ChargeStatusResponse,
  NETWORK_DISPLAY,
} from "@/lib/types/payment";

const API_BASE = `${API_BASE_URL}/api/v1`;

// Network display mapping
const NETWORK_INFO: Record<string, { id: string; name: string }[]> = {
  CM: [
    { id: "MTN", name: "MTN Mobile Money" },
    { id: "ORANGE", name: "Orange Money" },
  ],
  CI: [
    { id: "MTN", name: "MTN Mobile Money" },
    { id: "ORANGE", name: "Orange Money" },
    { id: "MOOV", name: "Moov Money" },
  ],
  SN: [
    { id: "ORANGE", name: "Orange Money" },
    { id: "FREE", name: "Free Money" },
  ],
  GH: [
    { id: "MTN", name: "MTN MoMo" },
    { id: "VODAFONE", name: "Vodafone Cash" },
    { id: "AIRTELTIGO", name: "AirtelTigo Money" },
  ],
  KE: [
    { id: "MPESA", name: "M-Pesa" },
    { id: "AIRTEL", name: "Airtel Money" },
  ],
  UG: [
    { id: "MTN", name: "MTN MoMo" },
    { id: "AIRTEL", name: "Airtel Money" },
  ],
};

export default function CreditsPage() {
  // Step management
  const [step, setStep] = useState<PaymentStep>(1);

  // Data
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [selectedPack, setSelectedPack] = useState<CreditPackage | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    country: "CM",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");

  // Payment state
  const [processing, setProcessing] = useState(false);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "successful" | "failed">("idle");
  const [error, setError] = useState<string>("");

  // Fetch packages and countries on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesRes, countriesRes] = await Promise.all([
          fetch(`${API_BASE}/payments/packages`),
          fetch(`${API_BASE}/payments/countries`),
        ]);

        const packagesData = await packagesRes.json();
        const countriesData = await countriesRes.json();

        setPackages(packagesData);
        setCountries(countriesData.countries || []);

        // Auto-select popular pack
        const popular = packagesData.find((p: CreditPackage) => p.is_popular);
        if (popular) setSelectedPack(popular);

        // Try to detect user's country via IP
        detectCountry();
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Detect country from IP
  const detectCountry = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const countryCode = data.country_code;

      // Check if country is in our supported list
      if (countries.find((c) => c.code === countryCode) || NETWORK_INFO[countryCode]) {
        setCustomerInfo((prev) => ({ ...prev, country: countryCode }));
      }
    } catch (err) {
      console.log("Could not detect country, using default");
    }
  };

  // Get current country config
  const currentCountry = countries.find((c) => c.code === customerInfo.country);
  const availableNetworks = NETWORK_INFO[customerInfo.country] || [];

  // Update network when country changes
  useEffect(() => {
    if (availableNetworks.length > 0) {
      setSelectedNetwork(availableNetworks[0].id);
    } else {
      setSelectedNetwork("");
    }
  }, [customerInfo.country]);

  // Polling for Mobile Money status (max 2 minutes = 24 polls * 5s)
  useEffect(() => {
    if (processing && paymentMethod === "mobile_money" && txRef && paymentStatus === "pending") {
      let attempts = 0;
      const maxAttempts = 24;
      const controller = new AbortController();

      const interval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(interval);
          setPaymentStatus("failed");
          setError("Delai d'attente depasse. Si vous avez valide le paiement, vos credits seront ajoutes automatiquement.");
          setProcessing(false);
          return;
        }

        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();

          const res = await fetch(`${API_BASE}/payments/charge-status/${txRef}`, {
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {},
            signal: controller.signal,
          });
          const data: ChargeStatusResponse = await res.json();

          if (data.status === "successful") {
            setPaymentStatus("successful");
            setProcessing(false);
            clearInterval(interval);
          } else if (data.status === "failed") {
            setPaymentStatus("failed");
            setError(data.message || "Payment failed");
            setProcessing(false);
            clearInterval(interval);
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Status check error:", err);
          }
        }
      }, 5000);

      return () => {
        clearInterval(interval);
        controller.abort();
      };
    }
  }, [processing, paymentMethod, txRef, paymentStatus]);

  // Handle payment submission
  const handlePayment = async () => {
    if (!selectedPack) return;

    setProcessing(true);
    setError("");
    setPaymentStatus("pending");

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("You must be logged in to make a purchase");
      }

      const response = await fetch(`${API_BASE}/payments/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          package_id: selectedPack.id,
          customer_name: customerInfo.name,
          phone_number: customerInfo.phone,
          country_code: customerInfo.country,
          payment_method: paymentMethod,
          network: paymentMethod === "mobile_money" ? selectedNetwork : undefined,
        }),
      });

      const data: InitiatePaymentResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as any).detail || "Payment initiation failed");
      }

      if (data.payment_method === "card" && data.payment_link) {
        // Redirect to Flutterwave page
        window.location.href = data.payment_link;
      } else {
        // Mobile Money - show instructions and poll
        setTxRef(data.transaction_id);
        setInstructions(data.instructions || "Validez le paiement sur votre telephone");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "An error occurred");
      setPaymentStatus("failed");
      setProcessing(false);
    }
  };

  // Navigation
  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return selectedPack !== null;
      case 2:
        return customerInfo.name.trim() !== "" && customerInfo.phone.trim() !== "";
      case 3:
        return paymentMethod === "card" || (paymentMethod === "mobile_money" && selectedNetwork !== "");
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < 4) {
      setStep((step + 1) as PaymentStep);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as PaymentStep);
    }
  };

  // Render loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Acheter des Credits</h1>
        <p className="text-white/60">
          Paiement simple et securise avec Mobile Money ou Carte bancaire
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                s === step
                  ? "bg-primary text-white"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`w-12 md:w-20 h-1 mx-1 ${
                  s < step ? "bg-green-500" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="hidden md:flex justify-between mb-8 px-4">
        <span className={step === 1 ? "text-primary" : "text-white/40"}>Pack</span>
        <span className={step === 2 ? "text-primary" : "text-white/40"}>Informations</span>
        <span className={step === 3 ? "text-primary" : "text-white/40"}>Paiement</span>
        <span className={step === 4 ? "text-primary" : "text-white/40"}>Confirmation</span>
      </div>

      {/* Content */}
      <div className="glass-card rounded-2xl p-6 md:p-8">
        {/* STEP 1: Select Package */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-6">Choisissez votre pack</h2>

            {/* Benefits */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-white/60">1 chanson = 5 credits</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Infinity className="w-4 h-4 text-primary" />
                <span className="text-white/60">Jamais d&apos;expiration</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pack) => (
                <div
                  key={pack.id}
                  onClick={() => setSelectedPack(pack)}
                  className={`relative rounded-xl p-5 cursor-pointer transition-all ${
                    pack.is_popular
                      ? "bg-gradient-to-b from-primary/20 to-transparent border-2 border-primary"
                      : selectedPack?.id === pack.id
                      ? "bg-white/5 border-2 border-primary/50"
                      : "bg-white/5 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {pack.is_popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#FFD700] text-black text-xs font-bold rounded-full">
                      POPULAIRE
                    </div>
                  )}

                  <h3 className="font-bold mb-2">{pack.name}</h3>
                  <div className="mb-3">
                    <span className="text-3xl font-bold">{pack.credits}</span>
                    <span className="text-white/60 ml-2 text-sm">credits</span>
                  </div>

                  <ul className="space-y-1 mb-4">
                    {pack.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-white/60">
                        <Check className="w-3 h-3 text-green-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="text-lg font-bold">
                    {pack.price.toLocaleString()} {pack.currency}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Customer Info */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-6">Vos informations</h2>

            <div className="space-y-4 max-w-md">
              {/* Name */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Pays</label>
                <select
                  value={customerInfo.country}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code} className="bg-[#1a1122]">
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm text-white/60 mb-2">Numero de telephone</label>
                <div className="flex gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60">
                    {currentCountry?.dial_code || "+237"}
                  </div>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="677123456"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Payment Method */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-6">Mode de paiement</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Mobile Money Option */}
              {currentCountry?.mobile_money && (
                <div
                  onClick={() => setPaymentMethod("mobile_money")}
                  className={`rounded-xl p-5 cursor-pointer transition-all ${
                    paymentMethod === "mobile_money"
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-white/5 border border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="w-6 h-6" />
                    <span className="font-bold">Mobile Money</span>
                  </div>
                  <p className="text-sm text-white/60">
                    Paiement direct via votre operateur mobile
                  </p>
                </div>
              )}

              {/* Card Option */}
              <div
                onClick={() => setPaymentMethod("card")}
                className={`rounded-xl p-5 cursor-pointer transition-all ${
                  paymentMethod === "card"
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="w-6 h-6" />
                  <span className="font-bold">Carte bancaire</span>
                </div>
                <p className="text-sm text-white/60">Visa, Mastercard via Flutterwave</p>
              </div>
            </div>

            {/* Network Selection for Mobile Money */}
            {paymentMethod === "mobile_money" && availableNetworks.length > 0 && (
              <div>
                <label className="block text-sm text-white/60 mb-3">
                  Selectionnez votre operateur
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableNetworks.map((network) => (
                    <button
                      key={network.id}
                      onClick={() => setSelectedNetwork(network.id)}
                      className={`px-5 py-3 rounded-xl font-medium transition-all ${
                        selectedNetwork === network.id
                          ? "bg-primary text-white"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      {network.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && (
          <div>
            {paymentStatus === "idle" || paymentStatus === "pending" ? (
              <>
                <h2 className="text-xl font-bold mb-6">Confirmation</h2>

                {/* Summary */}
                <div className="bg-white/5 rounded-xl p-5 mb-6">
                  <h3 className="font-bold mb-4">Recapitulatif</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Pack</span>
                      <span className="font-medium">{selectedPack?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Credits</span>
                      <span className="font-medium">{selectedPack?.credits} credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Methode</span>
                      <span className="font-medium">
                        {paymentMethod === "mobile_money"
                          ? `Mobile Money (${selectedNetwork})`
                          : "Carte bancaire"}
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-3 mt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-primary">
                          {selectedPack?.price.toLocaleString()} {currentCountry?.currency || "XAF"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">{error}</span>
                  </div>
                )}

                {/* Processing State for Mobile Money */}
                {processing && paymentMethod === "mobile_money" && (
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 mb-6 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                    <h3 className="font-bold mb-2">En attente de validation</h3>
                    <p className="text-white/60 text-sm mb-3">{instructions}</p>
                    <p className="text-xs text-white/40 mb-4">
                      Veuillez valider le paiement sur votre telephone...
                    </p>
                    <button
                      onClick={() => {
                        setProcessing(false);
                        setPaymentStatus("idle");
                        setTxRef(null);
                        setError("");
                      }}
                      className="text-sm text-white/50 hover:text-white underline transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                )}

                {/* Confirm Button */}
                {!processing && (
                  <button
                    onClick={handlePayment}
                    className="w-full bg-gradient-to-r from-primary to-[#FFD700] text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Confirmer le paiement
                  </button>
                )}
              </>
            ) : paymentStatus === "successful" ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Paiement reussi!</h2>
                <p className="text-white/60 mb-6">
                  {selectedPack?.credits} credits ont ete ajoutes a votre compte
                </p>
                <a
                  href="/create"
                  className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Creer une chanson
                </a>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Paiement echoue</h2>
                <p className="text-white/60 mb-6">{error || "Une erreur est survenue"}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {txRef && (
                    <button
                      onClick={async () => {
                        setError("");
                        setProcessing(true);
                        try {
                          const supabase = createClient();
                          const { data: { session } } = await supabase.auth.getSession();
                          const res = await fetch(`${API_BASE}/payments/charge-status/${txRef}`, {
                            headers: session?.access_token
                              ? { Authorization: `Bearer ${session.access_token}` }
                              : {},
                          });
                          const data: ChargeStatusResponse = await res.json();
                          if (data.status === "successful") {
                            setPaymentStatus("successful");
                          } else if (data.status === "failed") {
                            setError(data.message || "Paiement non trouve");
                          } else {
                            setError("Paiement toujours en attente. Reessayez dans quelques instants.");
                          }
                        } catch {
                          setError("Erreur de verification");
                        } finally {
                          setProcessing(false);
                        }
                      }}
                      disabled={processing}
                      className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Verifier mon paiement
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setPaymentStatus("idle");
                      setError("");
                      setProcessing(false);
                      setTxRef(null);
                    }}
                    className="bg-white/10 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/20 transition-colors"
                  >
                    Reessayer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {paymentStatus === "idle" && !processing && (
          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center gap-2 text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Retour
            </button>

            {step < 4 && (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-primary text-white font-bold px-6 py-2 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continuer
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(26, 17, 34, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}
