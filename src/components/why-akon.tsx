import { site } from '../content/site';
import { Reveal, SectionIntro } from './reveal';

export function WhyAkon() {
  return (
    <section className="why section-shell" id="why" aria-labelledby="why-title">
      <div className="why-grid">
        <Reveal>
          <SectionIntro index="05" label="WHY A_KON" />
          <h2 id="why-title" className="display-stack compact">
            <span>{site.why.headline[0]}</span>
            <span>{site.why.headline[1]}</span>
            <span>
              <span className="serif-accent">THOUGHTFUL</span> WORK<span className="text-lime">.</span>
            </span>
          </h2>
        </Reveal>

        <Reveal className="why-aside" delay={0.12}>
          <p className="lede">{site.why.copy}</p>
          <div className="why-points" role="list">
            {site.why.points.map((point) => (
              <div key={point} role="listitem">
                <span className="lime-dot" aria-hidden="true" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
