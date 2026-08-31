import { useEffect, useState } from "react";
import { getLogo35 } from "@/lib/teamLogos";
import { useTorneoHero } from "@/hooks/useTorneoHero";

interface Equipo {
  id: number;
  nombre: string;
  logo_url: string | null;
}

const TeamsSection35 = () => {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const hero = useTorneoHero("torneo35");

  useEffect(() => {
    fetch(`/api/torneo35/equipos?t=${Date.now()}`)
      .then((r) => r.ok ? r.json() : { equipos: [] })
      .then((d) => setEquipos(d.equipos ?? []))
      .catch(() => setEquipos([]));
  }, []);

  const badge = hero?.heroSubtitle ?? hero?.edicionNombre ?? "Edición Actual";
  const count = hero?.equiposCount ?? equipos.length;
  const descripcion = hero?.heroDescription
    ? `${count} equipos · ${hero.heroDescription}`
    : `${count} equipos compiten en la edición actual`;

  return (
    <section id="equipos" className="py-16 md:py-24 bg-gradient-to-b from-card to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-medium mb-4 tracking-wider uppercase">
            {badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-display text-foreground mb-4">
            Equipos <span className="text-gradient-gold">Participantes</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {descripcion}
          </p>
        </div>

        {equipos.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aún no se han registrado equipos para esta edición.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {equipos.map((team, index) => {
            const logo = team.logo_url ?? getLogo35(team.nombre);
            return (
              <div
                key={team.id}
                className="group relative flex flex-col items-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative w-full aspect-square bg-gradient-card rounded-xl border border-border/50 p-4 md:p-6 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-glow group-hover:-translate-y-2">
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={logo}
                      alt={`Logo de ${team.nombre}`}
                      className="max-w-full max-h-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110"
                      style={{
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
                        mixBlendMode: 'normal'
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                  </div>
                </div>
                <h3 className="mt-4 text-sm md:text-base font-medium text-center text-foreground/90 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                  {team.nombre}
                </h3>
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex justify-center">
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default TeamsSection35;
