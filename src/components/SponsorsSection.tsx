import { ExternalLink } from "lucide-react";
import amaysGroupLogo from "@/assets/sponsors/amaysgroup.png";

interface Sponsor {
  name: string;
  logo: string;
  website?: string;
  tier: "gold" | "silver";
}

const sponsors: Sponsor[] = [
  {
    name: "Amays Group",
    logo: amaysGroupLogo,
    website: "https://amaysgroup.com",
    tier: "gold",
  },
];

const SponsorsSection = () => {
  return (
    <section id="patrocinantes" className="py-16 md:py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background pointer-events-none" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-medium mb-4 tracking-wider">
            NUESTROS ALIADOS
          </span>
          <h2 className="text-3xl md:text-5xl font-display text-foreground mb-4">
            Patrocinantes <span className="text-gradient-gold">Oficiales</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Empresas que hacen posible la Liga FRM y apoyan el fútbol amateur
          </p>
        </div>

        {/* Sponsors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {sponsors.map((sponsor, index) => (
            <div
              key={sponsor.name}
              className="group animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {sponsor.website ? (
                <a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <SponsorCard sponsor={sponsor} />
                </a>
              ) : (
                <SponsorCard sponsor={sponsor} />
              )}
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-3 px-8 py-6 bg-gradient-card rounded-2xl border border-border/50">
            <p className="text-muted-foreground text-sm">
              ¿Quieres ser patrocinante de la Liga FRM?
            </p>
            <a
              href="https://wa.me/584243171902?text=Quiero%20ser%20patrocinante%20de%20la%20Liga%20FRM"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-all hover:scale-105"
            >
              Contáctanos
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="mt-16 flex justify-center">
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
};

const SponsorCard = ({ sponsor }: { sponsor: Sponsor }) => {
  return (
    <div className="relative h-48 md:h-56 bg-gradient-card rounded-2xl border border-border/50 p-6 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-glow group-hover:-translate-y-1 overflow-hidden">
      {/* Tier badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
          sponsor.tier === "gold" 
            ? "bg-primary/20 text-primary" 
            : "bg-muted text-muted-foreground"
        }`}>
          {sponsor.tier === "gold" ? "Gold Partner" : "Partner"}
        </span>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

      {/* Logo container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={sponsor.logo}
          alt={`Logo de ${sponsor.name}`}
          className="max-w-[200px] max-h-[100px] md:max-w-[240px] md:max-h-[120px] object-contain transition-transform duration-300 group-hover:scale-105"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
          }}
        />
      </div>

      {/* Sponsor name */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <h3 className="text-sm font-medium text-foreground/80 group-hover:text-primary transition-colors flex items-center justify-center gap-2">
          {sponsor.name}
          {sponsor.website && (
            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </h3>
      </div>
    </div>
  );
};

export default SponsorsSection;
