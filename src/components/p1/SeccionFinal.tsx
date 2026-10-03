'use client';

import { copyP1 } from './copy';
import { useHoldGesture } from './useHoldGesture';
import { HOLD_ZONE_SIZE } from '@/lib/hold';

export interface SeccionFinalProps {
  preview?: boolean;
  onOpenPanel?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export function SeccionFinal({
  preview = false,
  onOpenPanel,
  containerRef,
}: SeccionFinalProps) {
  const holdProps = useHoldGesture({
    disabled: preview,
    containerRef,
    onSuccess: () => {
      if (onOpenPanel) onOpenPanel();
    },
  });

  return (
    <section className="relative h-dvh snap-start flex items-center justify-center p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-md text-center">
        <h2 className="text-xl sm:text-2xl font-light tracking-wide text-neutral-100">
          {copyP1.seccionFinal}
        </h2>
      </div>

      {!preview && (
        <div
          {...holdProps}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute bg-transparent border-0 shadow-none pointer-events-auto"
          style={{
            bottom: 'max(0px, env(safe-area-inset-bottom))',
            right: 'max(0px, env(safe-area-inset-right))',
            width: `${HOLD_ZONE_SIZE}px`,
            height: `${HOLD_ZONE_SIZE}px`,
            touchAction: 'pan-y',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            WebkitTapHighlightColor: 'transparent',
            outline: 'none',
            cursor: 'default',
          }}
        />
      )}
    </section>
  );
}
