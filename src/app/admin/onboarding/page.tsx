"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useStore } from "@/context/StoreContext";
import { apiRequest, type StoreSummary } from "@/lib/api";
import Toast from "@/components/Toast";

const ONBOARDING_KEY = "mint_admin_onboarding_completed_v1";

type BusinessStage = "new" | "existing";
type SellType =
  | "products_own"
  | "products_dropshipping"
  | "products_pod"
  | "digital"
  | "services"
  | "later";
type SellPlace =
  | "online_store"
  | "events"
  | "social"
  | "retail_store"
  | "existing_site"
  | "marketplaces";

interface OnboardingState {
  storeName: string;
  country: string;
  category: string;
  businessStage: BusinessStage | null;
  sellTypes: SellType[];
  sellPlaces: SellPlace[];
}

type MainCategory = { id: string; name: string };

const initialState: OnboardingState = {
  storeName: "",
  country: "",
  category: "",
  businessStage: null,
  sellTypes: [],
  sellPlaces: [],
};

function isStoreOnboardingComplete(store: StoreSummary): boolean {
  const s = store.settings ?? {};
  if (s.onboarding_completed) return true;
  const ob = s.onboarding ?? {};
  return Boolean(
    (store.name ?? "").trim() &&
      (s.business_country ?? "").toString().trim() &&
      (ob.store_category ?? "").toString().trim() &&
      (ob.business_stage === "new" || ob.business_stage === "existing") &&
      Array.isArray(ob.sell_types) &&
      ob.sell_types.length > 0 &&
      Array.isArray(ob.sell_places) &&
      ob.sell_places.length > 0
  );
}

export default function AdminOnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { currentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(initialState);
  const [bootLoading, setBootLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeSnapshot, setStoreSnapshot] = useState<StoreSummary | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [mainCategoriesLoading, setMainCategoriesLoading] = useState(false);
  const [mainCategoriesError, setMainCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(ONBOARDING_KEY) === "true";
    if (done) router.replace("/admin");
  }, [router]);

  // Prefill from backend store settings (and honor server onboarding flag)
  useEffect(() => {
    if (!token || !currentStore) {
      setBootLoading(false);
      return;
    }
    let cancelled = false;
    setBootLoading(true);
    setError(null);
    apiRequest<StoreSummary>("/store", { token, storeId: currentStore.id })
      .then((store) => {
        if (cancelled) return;
        setStoreSnapshot(store);
        if (isStoreOnboardingComplete(store)) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(ONBOARDING_KEY, "true");
          }
          router.replace("/admin");
          return;
        }

        const settings = store.settings ?? {};
        const onboarding = settings.onboarding ?? {};
        setState((prev) => ({
          ...prev,
          storeName: store.name ?? prev.storeName,
          country: (settings.business_country as string | undefined) ?? prev.country,
          category: (onboarding.store_category as string | null | undefined) ?? prev.category,
          businessStage: (onboarding.business_stage as BusinessStage | null | undefined) ?? prev.businessStage,
          sellTypes: (onboarding.sell_types as SellType[] | null | undefined) ?? prev.sellTypes,
          sellPlaces: (onboarding.sell_places as SellPlace[] | null | undefined) ?? prev.sellPlaces,
        }));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load onboarding");
      })
      .finally(() => {
        if (!cancelled) setBootLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, currentStore?.id, router]);

  // Load main categories from API for step 1 dropdown
  useEffect(() => {
    if (!token || !currentStore) return;
    let cancelled = false;
    setMainCategoriesLoading(true);
    setMainCategoriesError(null);
    apiRequest<MainCategory[]>("/store/product-categories", {
      token,
      storeId: currentStore.id,
    })
      .then((res) => {
        if (cancelled) return;
        setMainCategories(res ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setMainCategoriesError(e instanceof Error ? e.message : "Failed to load categories");
        setMainCategories([]);
      })
      .finally(() => {
        if (!cancelled) setMainCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, currentStore?.id]);

  const persistToApi = async (opts?: { completed?: boolean }): Promise<StoreSummary | null> => {
    if (!token || !currentStore || !storeSnapshot) return null;
    setSaving(true);
    setError(null);
    try {
      const body: {
        name: string;
        email: string | null;
        plan: string;
        is_active: boolean;
        settings: Record<string, unknown>;
      } = {
        name: state.storeName.trim() || storeSnapshot.name || currentStore.name,
        email: storeSnapshot.email ?? null,
        plan: storeSnapshot.plan,
        is_active: storeSnapshot.is_active,
        settings: {
          ...(storeSnapshot.settings ?? {}),
          business_country: state.country || null,
          onboarding: {
            store_category: state.category || null,
            business_stage: state.businessStage ?? null,
            sell_types: state.sellTypes,
            sell_places: state.sellPlaces,
          },
          ...(opts?.completed
            ? { onboarding_completed: true, onboarding_completed_at: new Date().toISOString() }
            : {}),
        },
      };
      await apiRequest<StoreSummary>("/store", {
        method: "PATCH",
        token,
        storeId: currentStore.id,
        body,
      });
      // refresh snapshot so future saves merge correctly
      const refreshed = await apiRequest<StoreSummary>("/store", { token, storeId: currentStore.id });
      setStoreSnapshot(refreshed);
      return refreshed;
    } finally {
      setSaving(false);
    }
  };

  const goNext = async () => {
    if (step === 1 && (!state.storeName.trim() || !state.country || !state.category)) return;
    if (step === 2 && !state.businessStage) return;
    if (step === 3 && state.sellTypes.length === 0) return;
    if (step === 4 && state.sellPlaces.length === 0) return;

    if (step < 4) {
      // Save progress on each step transition (don’t advance if save fails)
      try {
        await persistToApi();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
        return;
      }
      setStep((s) => s + 1);
      return;
    }

    try {
      const refreshed = await persistToApi({ completed: true });
      const confirmed = refreshed ? isStoreOnboardingComplete(refreshed) : false;

      if (typeof window !== "undefined") {
        // Always set local flag so onboarding is truly "once" per device.
        // Server-side confirmation is preferred, but some backends may not echo custom settings back immediately.
        window.localStorage.setItem(ONBOARDING_KEY, "true");
        window.localStorage.setItem("mint_admin_onboarding_answers_v1", JSON.stringify(state));
      }

      if (confirmed) {
        setToast({ type: "success", message: "Setup complete. Welcome to Mint Admin." });
      } else {
        setToast({
          type: "warning",
          message:
            "Saved successfully, but the server didn’t confirm completion yet. You can continue — we won’t show this again on this device.",
        });
      }

      setTimeout(() => router.replace("/admin"), confirmed ? 700 : 900);
    } catch (e) {
      setToast({ type: "error", message: e instanceof Error ? e.message : "Failed to finish onboarding" });
      setError(e instanceof Error ? e.message : "Failed to finish onboarding");
    }
  };

  const goBack = () => {
    setStep((s) => (s > 1 ? s - 1 : s));
  };

  const toggleSellType = (value: SellType) => {
    setState((prev) => ({
      ...prev,
      sellTypes: prev.sellTypes.includes(value)
        ? prev.sellTypes.filter((v) => v !== value)
        : [...prev.sellTypes, value],
    }));
  };

  const toggleSellPlace = (value: SellPlace) => {
    setState((prev) => ({
      ...prev,
      sellPlaces: prev.sellPlaces.includes(value)
        ? prev.sellPlaces.filter((v) => v !== value)
        : [...prev.sellPlaces, value],
    }));
  };

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-mint/5 to-white flex items-center justify-center px-4 py-10">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={toast.type === "warning" ? 5000 : 3000}
        />
      )}
      <div className="w-full max-w-5xl grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] items-stretch">
        <div className="rounded-3xl bg-white shadow-xl shadow-mint/10 border border-gray-200/80">
          <div className="px-6 sm:px-10 pt-6 sm:pt-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-mint uppercase">
                  Store setup
                </p>
                <p className="text-xs text-gray-500">
                  Step {step} of 4
                </p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mint to-mint-dark transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="px-6 sm:px-10 pb-8 sm:pb-10">
            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {!currentStore ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-gray-900">Select a store</p>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a store from the header to complete onboarding.
                </p>
                <button
                  type="button"
                  onClick={() => router.replace("/admin")}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark"
                >
                  ← Back to Admin
                </button>
              </div>
            ) : bootLoading ? (
              <div className="py-10 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-mint border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {step === 1 && (
                  <StepOne
                    state={state}
                    setState={setState}
                    goNext={goNext}
                    goBack={goBack}
                    saving={saving}
                    mainCategories={mainCategories}
                    mainCategoriesLoading={mainCategoriesLoading}
                    mainCategoriesError={mainCategoriesError}
                  />
                )}
                {step === 2 && (
                  <StepTwo state={state} setState={setState} goNext={goNext} goBack={goBack} saving={saving} />
                )}
                {step === 3 && (
                  <StepThree
                    state={state}
                    toggleSellType={toggleSellType}
                    goNext={goNext}
                    goBack={goBack}
                    saving={saving}
                  />
                )}
                {step === 4 && (
                  <StepFour
                    state={state}
                    toggleSellPlace={toggleSellPlace}
                    goNext={goNext}
                    goBack={goBack}
                    saving={saving}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-gradient-to-br from-mint-dark via-mint to-emerald-400 text-white p-8 shadow-xl shadow-mint/30">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint-50/80">
              Preview
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-snug">
              {state.storeName || 'Your new Mint store'}
            </h2>
            <p className="mt-2 text-sm text-mint-50/90 max-w-sm">
              We&apos;ll use these answers to tune your dashboard, analytics, and product
              recommendations for your business.
            </p>
          </div>
          <div className="mt-6 space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <span className="text-mint-50/90">Country / region</span>
              <span className="font-medium text-white">
                {state.country || 'Not set yet'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <span className="text-mint-50/90">Store category</span>
              <span className="font-medium text-white">
                {state.category || 'Not set yet'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <span className="text-mint-50/90">Business stage</span>
              <span className="font-medium text-white">
                {state.businessStage === 'new'
                  ? 'New business'
                  : state.businessStage === 'existing'
                    ? 'Existing business'
                    : 'Not set yet'}
              </span>
            </div>
          </div>
          <p className="mt-6 text-[11px] text-mint-50/80">
            You can change these details later from Settings. This wizard just helps us start
            you in the right place.
          </p>
        </div>
      </div>
      {saving && (
        <div className="fixed bottom-4 right-4 rounded-2xl border border-white/20 bg-gray-900/80 px-4 py-2 text-xs font-medium text-white backdrop-blur">
          Saving…
        </div>
      )}
    </div>
  );
}

interface StepPropsBase {
  state: OnboardingState;
  goNext: () => void;
  goBack: () => void;
  saving?: boolean;
}

interface StepOneProps extends StepPropsBase {
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
  mainCategories: MainCategory[];
  mainCategoriesLoading: boolean;
  mainCategoriesError: string | null;
}

function StepOne({
  state,
  setState,
  goNext,
  goBack,
  saving,
  mainCategories,
  mainCategoriesLoading,
  mainCategoriesError,
}: StepOneProps) {
  const disabled = !state.storeName.trim() || !state.country || !state.category || Boolean(saving);

  const fallbackCategories: MainCategory[] = [
    { id: "fashion", name: "Fashion & apparel" },
    { id: "electronics", name: "Electronics" },
    { id: "grocery", name: "Grocery / everyday essentials" },
    { id: "home", name: "Home & furniture" },
    { id: "services", name: "Services" },
    { id: "other", name: "Other" },
  ];

  const categoriesToShow = mainCategories.length > 0 ? mainCategories : fallbackCategories;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
          Almost done! What should we call your store?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          This is the name customers will see across your storefront, emails, and invoices. You can
          update it later in Settings.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="store-name"
            className="block text-xs font-medium text-gray-700 mb-1.5"
          >
            Store name
          </label>
          <input
            id="store-name"
            value={state.storeName}
            onChange={(e) =>
              setState((prev) => ({ ...prev, storeName: e.target.value }))
            }
            placeholder="e.g. Mint Fashion"
            className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-mint focus:ring-2 focus:ring-mint/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="country"
              className="block text-xs font-medium text-gray-700 mb-1.5"
            >
              Country / region
            </label>
            <select
              id="country"
              value={state.country}
              onChange={(e) =>
                setState((prev) => ({ ...prev, country: e.target.value }))
              }
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm bg-white focus:border-mint focus:ring-mint"
            >
              <option value="">Select a country</option>
              <option value="lk">Sri Lanka</option>
              <option value="us">United States</option>
              <option value="gb">United Kingdom</option>
              <option value="eu">European Union</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-xs font-medium text-gray-700 mb-1.5"
            >
              What best describes your store?
            </label>
            <select
              id="category"
              value={state.category}
              onChange={(e) =>
                setState((prev) => ({ ...prev, category: e.target.value }))
              }
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm bg-white focus:border-mint focus:ring-mint"
            >
              <option value="">Select a category</option>
              {mainCategoriesLoading && <option value="">Loading categories…</option>}
              {!mainCategoriesLoading &&
                categoriesToShow.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            {mainCategoriesError && (
              <p className="mt-1 text-xs text-amber-700">
                Using default categories (API error: {mainCategoriesError})
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
        <button
          type="button"
          onClick={goBack}
          disabled
          className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-gray-400 cursor-default"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl bg-mint px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-mint-dark disabled:opacity-60"
        >
          <span>Next</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

interface StepTwoProps extends StepPropsBase {
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
}

function StepTwo({ state, setState, goNext, goBack, saving }: StepTwoProps) {
  const disabled = !state.businessStage || Boolean(saving);

  const base =
    "flex flex-col items-start rounded-2xl border px-4 py-3 text-left text-sm ";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Step 2 of 4
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
          Is this shop for a new or existing business?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          This helps us suggest the right onboarding.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            setState((prev) => ({ ...prev, businessStage: "new" }))
          }
          className={
            base +
            (state.businessStage === "new"
              ? "border-mint bg-mint/5 text-gray-900"
              : "border-gray-200 hover:border-gray-300")
          }
        >
          <span className="font-medium">New business or idea</span>
          <span className="mt-1 text-xs text-gray-500">
            I&apos;m just getting started.
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setState((prev) => ({ ...prev, businessStage: "existing" }))
          }
          className={
            base +
            (state.businessStage === "existing"
              ? "border-mint bg-mint/5 text-gray-900"
              : "border-gray-200 hover:border-gray-300")
          }
        >
          <span className="font-medium">Existing business</span>
          <span className="mt-1 text-xs text-gray-500">
            I already sell online, offline, or both.
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-gray-600"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-mint font-medium disabled:opacity-60"
        >
          Next
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

interface StepThreeProps extends StepPropsBase {
  toggleSellType: (v: SellType) => void;
}

function StepThree({ state, toggleSellType, goNext, goBack, saving }: StepThreeProps) {
  const disabled = state.sellTypes.length === 0 || Boolean(saving);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Step 3 of 4
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
          What do you plan to sell?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          We&apos;ll get you the right features and tools.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <OptionCard
          label="Products I buy or make myself"
          help="Shipped by me"
          selected={state.sellTypes.includes("products_own")}
          onClick={() => toggleSellType("products_own")}
        />
        <OptionCard
          label="Digital products"
          help="Music, digital art, more"
          selected={state.sellTypes.includes("digital")}
          onClick={() => toggleSellType("digital")}
        />
        <OptionCard
          label="Dropshipping products"
          help="Sourced and shipped by a third party"
          selected={state.sellTypes.includes("products_dropshipping")}
          onClick={() => toggleSellType("products_dropshipping")}
        />
        <OptionCard
          label="Services"
          help="Coaching, housekeeping, consulting"
          selected={state.sellTypes.includes("services")}
          onClick={() => toggleSellType("services")}
        />
        <OptionCard
          label="Print-on-demand products"
          help="Designed by me, printed by a partner"
          selected={state.sellTypes.includes("products_pod")}
          onClick={() => toggleSellType("products_pod")}
        />
        <OptionCard
          label="I’ll decide later"
          help="Still exploring options"
          selected={state.sellTypes.includes("later")}
          onClick={() => toggleSellType("later")}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-gray-600"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={disabled}
          className="inline-flex items-center gap-1 text-mint font-medium disabled:opacity-60"
        >
          Next
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

interface StepFourProps extends StepPropsBase {
  toggleSellPlace: (v: SellPlace) => void;
}

function StepFour({ state, toggleSellPlace, goNext, goBack, saving }: StepFourProps) {
  const disabled = state.sellPlaces.length === 0 || Boolean(saving);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Step 4 of 4
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
          Where would you like to sell?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          We&apos;ll make sure you&apos;re set up to sell in these places.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <OptionCard
          label="An online store"
          help="Create a fully customisable website"
          selected={state.sellPlaces.includes("online_store")}
          onClick={() => toggleSellPlace("online_store")}
        />
        <OptionCard
          label="In person at a retail store"
          help="Brick-and-mortar stores"
          selected={state.sellPlaces.includes("retail_store")}
          onClick={() => toggleSellPlace("retail_store")}
        />
        <OptionCard
          label="In person at events"
          help="Markets, fairs, and pop-ups"
          selected={state.sellPlaces.includes("events")}
          onClick={() => toggleSellPlace("events")}
        />
        <OptionCard
          label="An existing website or blog"
          help="Add a buy button to your site"
          selected={state.sellPlaces.includes("existing_site")}
          onClick={() => toggleSellPlace("existing_site")}
        />
        <OptionCard
          label="Social media"
          help="Reach customers on Instagram, TikTok, and more"
          selected={state.sellPlaces.includes("social")}
          onClick={() => toggleSellPlace("social")}
        />
        <OptionCard
          label="Online marketplaces"
          help="List products on marketplaces"
          selected={state.sellPlaces.includes("marketplaces")}
          onClick={() => toggleSellPlace("marketplaces")}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1 text-gray-600"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Finish setup
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}

interface OptionCardProps {
  label: string;
  help: string;
  selected: boolean;
  onClick: () => void;
}

function OptionCard({ label, help, selected, onClick }: OptionCardProps) {
  const base =
    "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm w-full ";
  const variant = selected
    ? "border-mint bg-mint/5"
    : "border-gray-200 hover:border-gray-300";

  const badgeBase =
    "ml-3 inline-flex h-5 w-5 items-center justify-center rounded-md border text-[10px] ";
  const badgeVariant = selected
    ? "border-mint bg-mint text-white"
    : "border-gray-300 bg-white text-gray-400";

  return (
    <button type="button" onClick={onClick} className={base + variant}>
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="mt-1 text-xs text-gray-500">{help}</p>
      </div>
      <span className={badgeBase + badgeVariant} aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}

