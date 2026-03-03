import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BrowseCategories from '@/components/BrowseCategories';
import CategoryProducts from '@/components/CategoryProducts';
import FeaturedListings from '@/components/FeaturedListings';
import SpecialOffers from '@/components/SpecialOffers';
import TopSellers from '@/components/TopSellers';
import NewArrivals from '@/components/NewArrivals';
import WhyChooseUs from '@/components/WhyChooseUs';
import MarketplaceInsights from '@/components/MarketplaceInsights';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <BrowseCategories />
      <CategoryProducts />
      <SpecialOffers />
      <FeaturedListings />
      <TopSellers />
      <NewArrivals />
      <WhyChooseUs />
      <MarketplaceInsights />
      <Footer />
    </main>
  );
}
