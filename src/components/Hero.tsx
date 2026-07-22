import { ArrowDown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import heroTeam from "@/assets/hero-team.jpg"

const GMG_LOGO =
  "https://bunny-wp-pullzone-cghvklkcns.b-cdn.net/wp-content/uploads/2026/01/Untitled-design-32.png"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-black">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroTeam}
          alt="The Gautam Modi Group team"
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      </div>
      <div className="container py-28 text-white md:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <img src={GMG_LOGO} alt="Gautam Modi Group" className="mx-auto mb-8 h-14 w-auto brightness-0 invert" />
          <span className="inline-flex items-center gap-2 rounded-full border border-gmg-gold/40 bg-gmg-gold/10 px-3 py-1 text-xs font-medium tracking-wide text-gmg-gold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Gautam Modi Group · Careers
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Careers at <span className="text-gmg-gold">Gautam Modi Group</span>
          </h1>
          <p className="mt-5 text-lg font-semibold text-white/90 md:text-2xl">
            Build Your Career With One of India's Leading Automotive Groups
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
            Gautam Modi Group is one of India's fast-growing automotive groups, representing leading
            brands including Audi, Mahindra, Hyundai, Kia and MG. Join a high-growth organisation
            offering exciting career opportunities across sales, service, operations, finance, HR,
            marketing and leadership, backed by hands-on learning, strong industry partnerships, and
            accelerated career growth.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="#open-roles">
                Explore Open Roles <ArrowDown className="h-4 w-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a href="https://gautammodigroup.com/about-us/" target="_blank" rel="noreferrer">
                About the Group
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
