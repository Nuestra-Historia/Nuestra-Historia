'use client';

import { useEffect, useRef, useState } from 'react';

interface FraseItemProps {
  texto: string;
}

function FraseItem({ texto }: FraseItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // Animar una sola vez
        }
      },
      {
        threshold: 0.6,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="h-dvh snap-start flex items-center justify-center p-6 bg-neutral-950 text-neutral-100"
    >
      <div
        className={`max-w-lg text-center transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
          visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-8'
        }`}
      >
        <p className="text-lg sm:text-xl md:text-2xl font-light leading-relaxed tracking-wide text-neutral-200">
          {texto}
        </p>
      </div>
    </section>
  );
}

interface FrasesProps {
  frases: string[];
}

export function Frases({ frases }: FrasesProps) {
  if (!frases || frases.length === 0) {
    return null;
  }

  return (
    <>
      {frases.map((texto, idx) => (
        <FraseItem key={idx} texto={texto} />
      ))}
    </>
  );
}
