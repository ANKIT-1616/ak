import { Github, Linkedin } from 'lucide-react';
import { ReactNode } from 'react';
import { site } from '../content/site';
import { Reveal, SectionIntro } from './reveal';

export function About() {
  return (
    <section className="about section-shell" id="about" aria-labelledby="about-title">
      <div className="about-grid">
        <Reveal className="founder-visual-card">
          {site.about.founderImage ? (
            <div className="founder-image-wrapper">
              <img
                src={site.about.founderImage}
                alt={`${site.founder}, Founder, Web Designer & Developer at ${site.brand}`}
                loading="lazy"
                width="600"
                height="800"
                className="founder-photo"
              />
              <div className="founder-image-overlay" />
              <div className="founder-image-badge">
                <span className="lime-dot" aria-hidden="true" />
                <span>FOUNDER · WEB DESIGNER & DEVELOPER</span>
              </div>
              <div className="founder-image-footer">
                <span className="founder-name-mark">{site.founder}</span>
                <span className="founder-studio-tag">{site.brand}</span>
              </div>
            </div>
          ) : (
            <div className="placeholder-inner">
              <div className="placeholder-header">
                <span className="placeholder-index">STUDIO MONOGRAPH / 01</span>
                <span className="placeholder-tag">FOUNDER</span>
              </div>
              <div className="placeholder-center">
                <span className="placeholder-initials">
                  A<span className="text-lime">.</span>
                </span>
                <span className="placeholder-name">{site.founder.toUpperCase()}</span>
                <span className="placeholder-meta">{site.brand.toUpperCase()} · {site.location.toUpperCase()}</span>
              </div>
              <div className="placeholder-footer">
                <span className="placeholder-status">
                  <span className="lime-dot" aria-hidden="true" /> AVAILABLE FOR Q4/Q1
                </span>
                <span className="placeholder-note">
                  Founder photograph<br />to be configured
                </span>
              </div>
            </div>
          )}
        </Reveal>

        <div className="about-copy">
          <Reveal>
            <SectionIntro index="03" label="ABOUT A_KON" />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 id="about-title" className="display-stack compact">
              <span>{site.about.headline[0]}</span>
              <span>
                TECHNOLOGY-<span className="serif-accent">POWERED</span><span className="text-lime">.</span>
              </span>
            </h2>
          </Reveal>
          <Reveal className="about-description" delay={0.16}>
            <p>{site.about.description}</p>
            <div className="about-founder">
              <span className="founder-title">{site.founder}</span>
              <span className="founder-sub">Founder, Web Designer & Developer</span>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="skills-list" role="list" aria-label="Core studio disciplines">
              {site.about.skills.map((skill) => (
                <span key={skill} role="listitem">{skill}</span>
              ))}
            </div>
          </Reveal>
          <div className="social-row">
            <PlaceholderSocial
              icon={<Github size={17} aria-hidden="true" />}
              label="GitHub"
              href={site.about.social.github}
            />
            <PlaceholderSocial
              icon={<Linkedin size={17} aria-hidden="true" />}
              label="LinkedIn"
              href={site.about.social.linkedin}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PlaceholderSocial({ icon, label, href }: { icon: ReactNode; label: string; href: string }) {
  return href ? (
    <a
      className="social-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} profile (opens in new tab)`}
    >
      {icon}
      <span>{label}</span>
    </a>
  ) : (
    <span className="social-link is-placeholder" title={`${label} link to be configured in site.ts`}>
      {icon}
      <span>{label}</span>
      <small>CONFIGURE</small>
    </span>
  );
}
