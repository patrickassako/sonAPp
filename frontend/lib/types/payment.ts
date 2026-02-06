/**
 * Payment types for BimZik
 */

// Country and payment configuration
export interface Country {
  code: string;
  name: string;
  currency: string;
  dial_code: string;
  mobile_money: boolean;
  networks: string[];
}

export interface CountriesResponse {
  countries: Country[];
}

// Payment methods
export type PaymentMethod = "mobile_money" | "card";

export type MobileNetwork =
  | "MTN"
  | "ORANGE"
  | "MOOV"
  | "VODAFONE"
  | "AIRTELTIGO"
  | "MPESA"
  | "AIRTEL"
  | "FREE";

// Credit package
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  features: string[];
  is_popular: boolean;
}

// Payment request/response
export interface InitiatePaymentRequest {
  package_id: string;
  customer_name?: string;
  phone_number?: string;
  country_code?: string;
  payment_method?: PaymentMethod;
  network?: string;
}

export interface InitiatePaymentResponse {
  payment_link: string | null;
  transaction_id: string;
  payment_method: PaymentMethod;
  status: string;
  instructions?: string;
}

export interface ChargeStatusResponse {
  status: "pending" | "successful" | "failed";
  message: string;
  tx_ref: string;
}

// Customer info for payment form
export interface CustomerInfo {
  name: string;
  country: string;
  phone: string;
}

// Payment step in the stepper
export type PaymentStep = 1 | 2 | 3 | 4;

// Network display info
export interface NetworkInfo {
  id: MobileNetwork;
  name: string;
  logo?: string;
}

// Map of networks by country
export const NETWORK_DISPLAY: Record<string, NetworkInfo[]> = {
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
