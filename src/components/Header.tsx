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

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container flex h-20 items-center justify-between">
        <a href="https://gautammodigroup.com/" className="flex items-center gap-3">
          <img src={GMG_LOGO} alt="Gautam Modi Group" className="h-11 w-auto" />
          <span className="hidden text-xs font-medium uppercase tracking-widest text-gmg-gold sm:inline">
            Careers
          </span>
        </a>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-gmg-gold"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm font-semibold text-gmg-gold transition-colors hover:text-gmg-gold/80"
          >
            Careers
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          {socials.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={name}
              className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-muted hover:text-gmg-gold"
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}
