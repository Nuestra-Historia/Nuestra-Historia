'use client';

import { copyP1 } from './copy';

export function SeccionFinal() {
  return (
    <section className="h-dvh snap-start flex items-center justify-center p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-md text-center">
        <h2 className="text-xl sm:text-2xl font-light tracking-wide text-neutral-100">
          {copyP1.seccionFinal}
        </h2>
      </div>
    </section>
  );
}
