import { useEffect, useState } from 'react';
import { SiteHeader } from './components/site-header';
import { Hero } from './components/hero';
import { Philosophy } from './components/philosophy';
import { SelectedWork } from './components/selected-work';
import { Services } from './components/services';
import { About } from './components/about';
import { Process } from './components/process';
import { WhyAkon } from './components/why-akon';
import { Contact } from './components/contact';
import { SiteFooter } from './components/site-footer';

export default function App() {
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorHovered, setCursorHovered] = useState(false);

  useEffect(() => {
    const isCoarse = window.matchMedia('(pointer: coarse)').matches;
    if (isCoarse) return;

    const cursor = document.querySelector<HTMLElement>('.cursor-orb');
    if (!cursor) return;

    const onPointerMove = (event: PointerEvent) => {
      setCursorVisible(true);
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.closest('a') ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('textarea') ||
          target.closest('select') ||
          target.closest('.service-trigger'))
      ) {
        setCursorHovered(true);
      } else {
        setCursorHovered(false);
      }
    };

    const onPointerLeave = () => {
      setCursorVisible(false);
      setCursorHovered(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
    };
  }, []);

  return (
    <div className="app-shell">
      <div
        className={`cursor-orb ${cursorVisible ? 'is-visible' : ''} ${cursorHovered ? 'is-hovered' : ''}`}
        aria-hidden="true"
      />
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <Philosophy />
        <SelectedWork />
        <Services />
        <About />
        <Process />
        <WhyAkon />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}
