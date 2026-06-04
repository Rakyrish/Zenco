import HeroSection from '@/features/home/HeroSection'
import StatsSection from '@/features/home/StatsSection'
import FeaturedProducts from '@/features/home/FeaturedProducts'
import WhyChooseUs from '@/features/home/WhyChooseUs'
import ServicesOverview from '@/features/home/ServicesOverview'
// import RecentBlog from '@/features/home/RecentBlog'
import CTABanner from '@/features/home/CTABanner'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <StatsSection />
      <FeaturedProducts />
      <WhyChooseUs />
      <ServicesOverview />
      {/* <RecentBlog /> */}
      <CTABanner />
    </div>
  )
}
