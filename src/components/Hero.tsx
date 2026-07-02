import { ArrowDown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-gmg-black">
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=2000&q=80"
          alt=""
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
      </div>
      <div className="container py-28 text-white md:py-36">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-gmg-gold/40 bg-gmg-gold/10 px-3 py-1 text-xs font-medium tracking-wide text-gmg-gold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Gautam Modi Group · Careers
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Build Your Career With <span className="text-gmg-gold">Gautam Modi Group</span>
          </h1>
          <p className="mt-5 text-lg font-medium text-white/90">
            We embrace new opportunities that inspire growth, innovation, and progress.
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
            Join one of India's fast-growing automotive groups, representing leading brands including
            Audi, Mahindra, Hyundai, Kia and MG. We are always looking for driven talent across sales,
            service, operations, finance, HR and leadership roles.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#jobs">
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
