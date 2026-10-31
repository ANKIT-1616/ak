import { site } from '../content/site';
import { Reveal, SectionIntro } from './reveal';

export function Philosophy() {
  return (
    <section className="philosophy section-shell section-dark" id="philosophy" aria-labelledby="philosophy-title">
      <div className="philosophy-grid">
        <Reveal>
          <SectionIntro index="00" label="POINT OF VIEW" />
          <h2 id="philosophy-title" className="display-stack">
            <span>{site.philosophy.headline[0]}</span>
            <span>{site.philosophy.headline[1]}</span>
            <span>
              <span className="serif-accent">MORE</span><span className="text-lime">.</span>
            </span>
          </h2>
        </Reveal>

        <Reveal className="philosophy-aside" delay={0.12}>
          <p className="lede">{site.philosophy.supporting}</p>
          <div className="principles-list" role="list">
            {site.philosophy.principles.map((principle, index) => (
              <div className="principle" key={principle} role="listitem">
                <span className="principle-number">0{index + 1}</span>
                <strong className="principle-text">{principle}</strong>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
