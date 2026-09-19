/** @jsxImportSource preact */

interface Props {
  /** Paso actual (1 = datos, 2 = envío, 3 = pago, 4 = confirmar). */
  step: 1 | 2 | 3 | 4;
}

/**
 * Stepper visual del checkout.
 * Muestra 4 pasos discretos: datos → envío → pago → confirmar.
 * Marca el actual con forest; los siguientes con muted.
 */
const STEPS = [
  { n: 1, label: "Datos" },
  { n: 2, label: "Envío" },
  { n: 3, label: "Pago" },
  { n: 4, label: "Confirmar" },
] as const;

export default function CheckoutStepper({ step }: Props) {
  return (
    <ol
      class="grid grid-cols-4 gap-2 md:gap-3 mb-10 md:mb-14"
      aria-label="Pasos del checkout"
      role="list"
    >
      {STEPS.map((s) => {
        const state =
          s.n < step ? "done" : s.n === step ? "current" : "todo";
        return (
          <li
            key={s.n}
            class={`flex flex-col gap-1.5 px-3 py-3 rounded-2xl border transition-colors duration-300 ${
              state === "current"
                ? "border-forest bg-forest/5"
                : state === "done"
                  ? "border-forest/30 bg-cream"
                  : "border-[var(--color-hairline)] bg-cream/40"
            }`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <div class="flex items-center gap-2">
              <span
                class={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-medium ${
                  state === "current"
                    ? "bg-forest text-cream"
                    : state === "done"
                      ? "bg-forest/20 text-forest"
                      : "bg-linen text-muted"
                }`}
                aria-hidden="true"
              >
                {state === "done" ? (
                  <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12l5 5 9-11" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                ) : (
                  s.n
                )}
              </span>
              <span
                class={`text-xs uppercase tracking-[0.18em] ${
                  state === "todo" ? "text-muted" : "text-ink"
                }`}
              >
                {s.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
