import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { site } from '../content/site';
import { useReducedMotion } from '../hooks/use-reduced-motion';

const links = [
  { label: 'WORK', href: '#work', id: 'work' },
  { label: 'SERVICES', href: '#services', id: 'services' },
  { label: 'ABOUT', href: '#about', id: 'about' },
  { label: 'PROCESS', href: '#process', id: 'process' },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  // Scroll detection for sticky header backdrop styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for active section highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    const sectionElements = links
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => el !== null);

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  // Keyboard accessibility & focus trap for mobile menu
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }

      // Simple focus trap
      if (event.key === 'Tab' && mobileNavRef.current) {
        const focusable = mobileNavRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <header className={`site-header ${isScrolled ? 'is-scrolled' : ''}`}>
      <a
        className="brand-lockup"
        href="#top"
        aria-label="A_KON Digital Studio home"
        onClick={close}
      >
        <span className="brand-mark">{site.mark}</span>
        <span className="brand-subline">
          {site.founder} · {site.location}
        </span>
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {links.map((link) => {
          const isActive = activeSection === link.id;
          return (
            <a
              key={link.href}
              href={link.href}
              className={isActive ? 'is-active' : ''}
              aria-current={isActive ? 'location' : undefined}
            >
              {link.label}
            </a>
          );
        })}
      </nav>

      <a className="header-cta" href="#contact">
        <span>LET&apos;S TALK</span>
        <ArrowUpRight size={15} strokeWidth={1.6} aria-hidden="true" />
      </a>

      <button
        ref={menuButtonRef}
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            ref={mobileNavRef}
            id="mobile-navigation"
            className="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            initial={reduced ? false : { opacity: 0, y: -16 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="mobile-nav-header">
              <span className="brand-mark">{site.mark}</span>
              <button
                type="button"
                className="mobile-close-btn"
                onClick={close}
                aria-label="Close navigation"
              >
                <X size={26} strokeWidth={1.5} />
              </button>
            </div>

            <div className="mobile-nav-links">
              {links.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className={activeSection === link.id ? 'is-active' : ''}
                  initial={reduced ? false : { opacity: 0, x: -18 }}
                  animate={reduced ? undefined : { opacity: 1, x: 0 }}
                  transition={reduced ? { duration: 0 } : { delay: index * 0.04 }}
                >
                  <span className="mobile-link-index">0{index + 1}</span>
                  <span className="mobile-link-label">{link.label}</span>
                </motion.a>
              ))}
            </div>

            <div className="mobile-nav-footer">
              <a className="mobile-talk button button-solid w-full justify-between" href="#contact" onClick={close}>
                <span>LET&apos;S TALK</span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
              <p className="mobile-tagline">{site.footer.tagline}</p>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
