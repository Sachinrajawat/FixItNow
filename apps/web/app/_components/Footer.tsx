import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Browse services", href: "/search/Cleaning" },
      { label: "How it works", href: "/about" },
      { label: "My bookings", href: "/mybooking" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "mailto:sachinrajawat835@gmail.com" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-muted/30 mt-16 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <h3 className="text-primary text-xl font-bold">FixItNow</h3>
          <p className="text-muted-foreground mt-3 text-sm">
            Book trusted home-service professionals — cleaning, plumbing,
            electrical, repairs and more — in just a few taps.
          </p>
          <div
            className="mt-4 flex items-center gap-3"
            aria-label="Social links"
          >
            <a
              href="https://github.com/Sachinrajawat/FixItNow"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="GitHub repository"
              className="text-muted-foreground hover:text-primary transition"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-primary transition"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="mailto:sachinrajawat835@gmail.com"
              aria-label="Send email"
              className="text-muted-foreground hover:text-primary transition"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3 md:max-w-xl md:justify-end">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-foreground text-sm font-semibold">
                {section.title}
              </h4>
              <ul className="mt-3 flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary text-sm transition"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-4 text-xs sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} FixItNow. All rights reserved.
          </p>
          <p>Built with Next.js, Tailwind CSS &amp; shadcn/ui.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
