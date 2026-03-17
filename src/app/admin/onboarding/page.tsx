"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

const initialState: OnboardingState = {
  storeName: "",
  country: "",
  category: "",
  businessStage: null,
  sellTypes: [],
  sellPlaces: [],
};

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>(initialState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(ONBOARDING_KEY) === "true";
    if (done) router.replace("/admin");
  }, [router]);

  const goNext = () => {
    if (step === 1 && (!state.storeName.trim() || !state.country || !state.category)) return;
    if (step === 2 && !state.businessStage) return;
    if (step === 3 && state.sellTypes.length === 0) return;
    if (step === 4 && state.sellPlaces.length === 0) return;

    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDING_KEY, "true");
      window.localStorage.setItem(
        "mint_admin_onboarding_answers_v1",
        JSON.stringify(state)
      );
    }
    router.replace("/admin");
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-lg border border-gray-200">
        <div className="px-6 sm:px-10 py-8 sm:py-10">
          {step === 1 && (
            <StepOne state={state} setState={setState} goNext={goNext} goBack={goBack} />
          )}
          {step === 2 && (
            <StepTwo state={state} setState={setState} goNext={goNext} goBack={goBack} />
          )}
          {step === 3 && (
            <StepThree
              state={state}
              toggleSellType={toggleSellType}
              goNext={goNext}
              goBack={goBack}
            />
          )}
          {step === 4 && (
            <StepFour
              state={state}
              toggleSellPlace={toggleSellPlace}
              goNext={goNext}
              goBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface StepPropsBase {
  state: OnboardingState;
  goNext: () => void;
  goBack: () => void;
}

interface StepOneProps extends StepPropsBase {
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
}

function StepOne({ state, setState, goNext, goBack }: StepOneProps) {
  const disabled = !state.storeName.trim() || !state.country || !state.category;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Step 1 of 4
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-gray-900">
          Almost done! What should we call your store?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          You can change your store name anytime.
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
            className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-mint focus:ring-mint"
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
              <option value="fashion">Fashion & apparel</option>
              <option value="electronics">Electronics</option>
              <option value="grocery">Grocery / everyday essentials</option>
              <option value="home">Home & furniture</option>
              <option value="services">Services</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
        <button
          type="button"
          onClick={goBack}
          disabled
          className="inline-flex items-center gap-1 text-gray-400 cursor-default"
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

interface StepTwoProps extends StepPropsBase {
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
}

function StepTwo({ state, setState, goNext, goBack }: StepTwoProps) {
  const disabled = !state.businessStage;

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

function StepThree({ state, toggleSellType, goNext, goBack }: StepThreeProps) {
  const disabled = state.sellTypes.length === 0;

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

function StepFour({ state, toggleSellPlace, goNext, goBack }: StepFourProps) {
  const disabled = state.sellPlaces.length === 0;

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

