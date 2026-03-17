import Header from '@/components/Header';
import Hero from '@/components/Hero';
import MarketplaceStoresAndProducts from '@/components/MarketplaceStoresAndProducts';
import BrowseCategories from '@/components/BrowseCategories';
import CategoryProducts from '@/components/CategoryProducts';
import FeaturedListings from '@/components/FeaturedListings';
import SpecialOffers from '@/components/SpecialOffers';
import TopSellers from '@/components/TopSellers';
import NewArrivals from '@/components/NewArrivals';
import WhyChooseUs from '@/components/WhyChooseUs';
import UserLevels from '@/components/UserLevels';
import Testimonials from '@/components/Testimonials';
import MarketplaceInsights from '@/components/MarketplaceInsights';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { StorefrontProvider } from '@/context/StorefrontContext';

export default function Home() {
  return (
    <StorefrontProvider>
      <main className="min-h-screen">
        <Header />
        <Hero />
        <div className="border-t border-gray-100" />
        {/* <MarketplaceStoresAndProducts /> */}
        <BrowseCategories />
        <CategoryProducts />
        <SpecialOffers />
        <FeaturedListings />
        <TopSellers />
        <NewArrivals />
        <WhyChooseUs />
        <UserLevels />
        <Testimonials />
        <MarketplaceInsights />
        <Newsletter />
        <Footer />
      </main>
    </StorefrontProvider>
  );
}
