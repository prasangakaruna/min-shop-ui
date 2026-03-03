import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BrowseCategories from '@/components/BrowseCategories';
import FeaturedListings from '@/components/FeaturedListings';
import MarketplaceInsights from '@/components/MarketplaceInsights';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <BrowseCategories />
      <FeaturedListings />
      <MarketplaceInsights />
      <Footer />
    </main>
  );
}
