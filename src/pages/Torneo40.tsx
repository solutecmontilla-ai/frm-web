import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TeamsSection from "@/components/TeamsSection";
import ResultsSection from "@/components/ResultsSection";
import StandingsSection from "@/components/StandingsSection";
import PlayoffBracket from "@/components/PlayoffBracket";
import UpcomingMatchesSection from "@/components/UpcomingMatchesSection";
import TopScorersSection from "@/components/TopScorersSection";
import SponsorsSection from "@/components/SponsorsSection";
import Footer from "@/components/Footer";

const Torneo40 = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <TeamsSection />
        <ResultsSection />
        <StandingsSection />
        <PlayoffBracket />
        <UpcomingMatchesSection />
        <TopScorersSection />
        <SponsorsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Torneo40;
