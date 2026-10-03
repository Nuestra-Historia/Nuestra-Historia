export const HOLD_MS = 3000;
export const MOVE_TOLERANCE_PX = 10;
export const HOLD_ZONE_SIZE = 48;
export const HOLD_CORNER = 'bottom-right' as const;

export type HoldCorner = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface HoldCallbacks {
  onTrigger: () => void;
}

export class HoldGesture {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private startX: number = 0;
  private startY: number = 0;
  private isHolding: boolean = false;
  private hasTriggered: boolean = false;
  private onTrigger: () => void;

  constructor(callbacks: HoldCallbacks) {
    this.onTrigger = callbacks.onTrigger;
  }

  start(x: number, y: number): void {
    this.cancel();
    this.startX = x;
    this.startY = y;
    this.isHolding = true;
    this.hasTriggered = false;

    this.timer = setTimeout(() => {
      if (this.isHolding && !this.hasTriggered) {
        this.hasTriggered = true;
        this.isHolding = false;
        this.timer = null;
        this.onTrigger();
      }
    }, HOLD_MS);
  }

  move(x: number, y: number): void {
    if (!this.isHolding || this.hasTriggered) return;

    const dx = x - this.startX;
    const dy = y - this.startY;
    const distSq = dx * dx + dy * dy;

    if (distSq > MOVE_TOLERANCE_PX * MOVE_TOLERANCE_PX) {
      this.cancel();
    }
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isHolding = false;
  }

  isActive(): boolean {
    return this.isHolding;
  }

  didTrigger(): boolean {
    return this.hasTriggered;
  }
}
