import Header from '@/components/Header';
import Hero from '@/components/Hero';
import StatsSection from '@/components/StatsSection';
import BrowseCategories from '@/components/BrowseCategories';
import CategoryProducts from '@/components/CategoryProducts';
import FeaturedListings from '@/components/FeaturedListings';
import SpecialOffers from '@/components/SpecialOffers';
import TopSellers from '@/components/TopSellers';
import NewArrivals from '@/components/NewArrivals';
import WhyChooseUs from '@/components/WhyChooseUs';
import Testimonials from '@/components/Testimonials';
import MarketplaceInsights from '@/components/MarketplaceInsights';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <div className="border-t border-gray-100"></div>
      <StatsSection />
      <BrowseCategories />
      <CategoryProducts />
      <SpecialOffers />
      <FeaturedListings />
      <TopSellers />
      <NewArrivals />
      <WhyChooseUs />
      <Testimonials />
      <MarketplaceInsights />
      <Newsletter />
      <Footer />
    </main>
  );
}
