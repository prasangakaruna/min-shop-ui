'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useStore } from '@/context/StoreContext';
import { apiRequest, type StoreSummary } from '@/lib/api';

type Plan = 'basic' | 'standard' | 'premium';
type BusinessStage = 'new' | 'existing' | '';

interface StepConfig {
  id: 1 | 2 | 3;
  label: string;
}

const STEPS: StepConfig[] = [
  { id: 1, label: 'Store details' },
  { id: 2, label: 'Business profile' },
  { id: 3, label: 'Sales channels & plan' },
];

export default function NewStorePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { refreshStores, setCurrentStore } = useStore();
  const token = (session as { access_token?: string } | null)?.access_token ?? null;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');

  const [businessStage, setBusinessStage] = useState<BusinessStage>('');
  const [sellTypes, setSellTypes] = useState<string[]>([]);
  const [sellPlaces, setSellPlaces] = useState<string[]>([]);
  const [plan, setPlan] = useState<Plan>('basic');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canGoNextFromStep1 =
    name.trim() && phone.trim() && country && city.trim() && category;
  const canGoNextFromStep2 =
    businessStage && sellTypes.length > 0;
  const canSubmit =
    sellPlaces.length > 0 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3 || !token || !canSubmit) return;

    setLoading(true);
    setError('');
    try {
      const store = await apiRequest<StoreSummary>('/me/stores', {
        method: 'POST',
        token,
        body: {
          name,
          email: email || undefined,
          plan,
          settings: {
            contact_phone: phone || null,
            country: country || null,
            city: city || null,
            category: category || null,
            business_stage: businessStage || null,
            sell_types: sellTypes,
            sell_places: sellPlaces,
          },
        },
      });
      await refreshStores();
      if (store && typeof store === 'object' && 'id' in store) {
        setCurrentStore(store as StoreSummary);
      }
      router.push('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const toggleFromArray = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="p-6">
      <div className="max-w-3xl">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-mint">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Add store</h1>
          <p className="text-gray-600 text-sm">
            Create a new store for your account. All fields marked <span className="text-red-500">*</span> are required.
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center gap-3 text-sm">
          {STEPS.map((s, index) => {
            const active = step === s.id;
            const completed = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
                    active
                      ? 'border-mint bg-mint/10 text-mint'
                      : completed
                        ? 'border-mint/40 bg-mint/5 text-mint'
                        : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                      active || completed ? 'bg-mint text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s.id}
                  </span>
                  <span>{s.label}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 space-y-6">
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-sm font-semibold text-gray-800">Store details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint"
                      placeholder="e.g. Mint Fashion"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact email <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint"
                      placeholder="store@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint"
                      placeholder="+94 7X XXX XXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country / region <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint bg-white"
                      required
                    >
                      <option value="">Select a country</option>
                      <option value="lk">Sri Lanka</option>
                      <option value="us">United States</option>
                      <option value="gb">United Kingdom</option>
                      <option value="eu">European Union</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City / area <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint"
                      placeholder="Colombo"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint bg-white"
                      required
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
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-sm font-semibold text-gray-800">Business profile</h2>
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-600 mb-1.5">
                    Is this shop for a new or existing business?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setBusinessStage('new')}
                      className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left text-sm ${
                        businessStage === 'new'
                          ? 'border-mint bg-mint/5 text-gray-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">New business or idea</span>
                      <span className="mt-1 text-xs text-gray-500">I&apos;m just getting started.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBusinessStage('existing')}
                      className={`flex flex-col items-start rounded-2xl border px-4 py-3 text-left text-sm ${
                        businessStage === 'existing'
                          ? 'border-mint bg-mint/5 text-gray-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium">Existing business</span>
                      <span className="mt-1 text-xs text-gray-500">
                        I already sell online, offline, or both.
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-600 mb-1.5">What do you plan to sell?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'products_own', label: 'Products I buy or make myself', help: 'Shipped by me' },
                      { id: 'digital', label: 'Digital products', help: 'Music, digital art, more' },
                      { id: 'products_dropshipping', label: 'Dropshipping products', help: 'Sourced and shipped by a third party' },
                      { id: 'services', label: 'Services', help: 'Coaching, housekeeping, consulting' },
                      { id: 'products_pod', label: 'Print-on-demand products', help: 'Designed by me, printed by a partner' },
                      { id: 'later', label: 'I’ll decide later', help: 'Still exploring options' },
                    ].map((opt) => {
                      const selected = sellTypes.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSellTypes((prev) => toggleFromArray(prev, opt.id))}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                            selected ? 'border-mint bg-mint/5' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{opt.label}</p>
                            <p className="mt-1 text-xs text-gray-500">{opt.help}</p>
                          </div>
                          <span
                            className={`ml-3 inline-flex h-5 w-5 items-center justify-center rounded-md border text-[10px] ${
                              selected ? 'border-mint bg-mint text-white' : 'border-gray-300 bg-white text-gray-400'
                            }`}
                            aria-hidden="true"
                          >
                            {selected ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-sm font-semibold text-gray-800">Sales channels & plan</h2>

                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-600 mb-1.5">Where would you like to sell?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'online_store', label: 'An online store', help: 'Create a fully customisable website' },
                      { id: 'retail_store', label: 'In person at a retail store', help: 'Brick-and-mortar stores' },
                      { id: 'events', label: 'In person at events', help: 'Markets, fairs, and pop-ups' },
                      { id: 'existing_site', label: 'An existing website or blog', help: 'Add a buy button to your site' },
                      { id: 'social', label: 'Social media', help: 'Reach customers on Instagram, TikTok, and more' },
                      { id: 'marketplaces', label: 'Online marketplaces', help: 'List products on marketplaces' },
                    ].map((opt) => {
                      const selected = sellPlaces.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSellPlaces((prev) => toggleFromArray(prev, opt.id))}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                            selected ? 'border-mint bg-mint/5' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{opt.label}</p>
                            <p className="mt-1 text-xs text-gray-500">{opt.help}</p>
                          </div>
                          <span
                            className={`ml-3 inline-flex h-5 w-5 items-center justify-center rounded-md border text-[10px] ${
                              selected ? 'border-mint bg-mint text-white' : 'border-gray-300 bg-white text-gray-400'
                            }`}
                            aria-hidden="true"
                          >
                            {selected ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as Plan)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-mint focus:border-mint bg-white"
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                className="inline-flex justify-center px-6 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s))}
                className="inline-flex justify-center px-6 py-2.5 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark disabled:opacity-50"
                disabled={
                  (step === 1 && !canGoNextFromStep1) ||
                  (step === 2 && !canGoNextFromStep2)
                }
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex justify-center px-6 py-2.5 bg-mint text-white rounded-lg font-medium hover:bg-mint-dark disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create store'}
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="inline-flex justify-center px-6 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

