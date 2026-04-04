import HeroSection from "../../components/user/home/HeroSection";
import WhyChooseUsSection from "../../components/user/home/WhyChooseUsSection";
import TypeLearningSection from "../../components/user/home/TypeLearningSection";
import FAQSection from "../../components/user/home/FAQSection";

export default function HomePage() {
    return (
        <>
            {/* Section 1: Hero */}
            <HeroSection/>
            {/* Section 2: why-choose-us */}
            <WhyChooseUsSection/>
            {/* Section 3: Type-Learning */}
            <TypeLearningSection/>
            {/* Section 4: FAQ Question */}
            <FAQSection/>
        </>
    );
}
