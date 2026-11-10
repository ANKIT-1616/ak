import { ArrowUp, ArrowUpRight, Github, Instagram, Linkedin } from 'lucide-react';
import { ReactNode } from 'react';
import { site } from '../content/site';

export function SiteFooter() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-main">
        <div>
          <span className="footer-brand">
            A_KON<span className="text-lime">®</span>
          </span>
          <p>{site.footer.tagline}</p>
        </div>

        <div className="footer-cta">
          <span className="detail-label">READY WHEN YOU ARE</span>
          <a href="#contact" className="footer-contact-link">
            <span>LET&apos;S BUILD</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="footer-grid">
        <FooterColumn
          title="NAVIGATION"
          links={[
            ['WORK', '#work'],
            ['SERVICES', '#services'],
            ['ABOUT', '#about'],
            ['PROCESS', '#process'],
            ['CONTACT', '#contact'],
          ]}
        />

        <FooterColumn
          title="SERVICES"
          links={site.services.map((service) => [service.title, '#services'])}
        />

        {Object.values(site.footer.socials).some(Boolean) && (
          <div>
            <span className="detail-label">CONNECT</span>
            <div className="footer-links">
              <FooterSocial
                label="Instagram"
                href={site.footer.socials.Instagram}
                icon={<Instagram size={15} aria-hidden="true" />}
              />
              <FooterSocial
                label="LinkedIn"
                href={site.footer.socials.LinkedIn}
                icon={<Linkedin size={15} aria-hidden="true" />}
              />
              <FooterSocial
                label="GitHub"
                href={site.footer.socials.GitHub}
                icon={<Github size={15} aria-hidden="true" />}
              />
            </div>
          </div>
        )}

        <div className="footer-meta-col">
          <span className="detail-label">LOCATION</span>
          <p className="footer-location">{site.location}</p>
          <button
            type="button"
            className="back-to-top"
            onClick={scrollToTop}
            aria-label="Scroll back to top of page"
          >
            <span>BACK TO TOP</span>
            <ArrowUp size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} A_KON DIGITAL STUDIO. ALL RIGHTS RESERVED.</span>
        <span>INDEPENDENT BY NATURE / CREATIVE BY DESIGN.</span>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <span className="detail-label">{title}</span>
      <div className="footer-links">
        {links.map(([label, href]) => (
          <a key={label} href={href}>
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

function FooterSocial({
  label,
  href,
  icon,
}: {
  label: string;
  href: string;
  icon: ReactNode;
}) {
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} profile (opens in new tab)`}
    >
      {icon}
      <span>{label}</span>
    </a>
  ) : (
    null
  );
}
