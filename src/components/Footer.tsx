import { Link } from "react-router-dom"
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react"

const GMG_LOGO =
  "https://bunny-wp-pullzone-cghvklkcns.b-cdn.net/wp-content/uploads/2026/01/Untitled-design-32.png"

const socials = [
  { name: "Facebook", href: "https://www.facebook.com/", Icon: Facebook },
  { name: "LinkedIn", href: "https://www.linkedin.com/", Icon: Linkedin },
  { name: "Instagram", href: "https://www.instagram.com/", Icon: Instagram },
  { name: "YouTube", href: "https://www.youtube.com/", Icon: Youtube },
]

const nav = [
  { label: "Home", href: "https://gautammodigroup.com/" },
  { label: "About Us", href: "https://gautammodigroup.com/about-us/" },
  { label: "Business", href: "https://gautammodigroup.com/business/" },
  { label: "Gallery", href: "https://gautammodigroup.com/gallery/" },
  { label: "Contact Us", href: "https://gautammodigroup.com/contact-us/" },
]

export function Footer() {
  return (
    <footer className="border-t bg-white text-foreground/70">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <img src={GMG_LOGO} alt="Gautam Modi Group" className="h-12 w-auto" />
            <p className="mt-4 max-w-sm text-sm text-foreground/60">
              We embrace new opportunities that inspire growth, innovation, and progress across a
              portfolio of leading automotive brands.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map(({ name, href, Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={name}
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-muted transition-colors hover:bg-gmg-gold hover:text-gmg-black"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gmg-gold">Explore</h3>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              {nav.map((item) => (
                <a key={item.label} href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gmg-gold">Careers</h3>
            <p className="mt-4 text-sm text-foreground/60">
              Looking to grow with us? Browse open roles and apply directly on this page.
            </p>
            <a
              href="https://gautammodigroup.com/contact-us/"
              className="mt-3 inline-block text-sm font-medium text-gmg-gold transition-colors hover:text-foreground"
            >
              Get in touch →
            </a>
            <Link
              to="/admin"
              className="mt-2 inline-block text-xs text-foreground/40 transition-colors hover:text-foreground/70"
            >
              Admin / CRM
            </Link>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-foreground/50">
          © {new Date().getFullYear()} Gautam Modi Group. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
