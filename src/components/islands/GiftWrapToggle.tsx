/** @jsxImportSource preact */

interface Props {
  enabled: boolean;
  message: string;
  onToggle: (enabled: boolean) => void;
  onMessageChange: (msg: string) => void;
}

/**
 * Gift wrap toggle + gift message.
 * Vive en CheckoutForm.tsx como input controlado.
 */
export default function GiftWrapToggle({ enabled, message, onToggle, onMessageChange }: Props) {
  return (
    <div class="flex flex-col gap-3 p-4 rounded-2xl border border-[var(--color-hairline)] bg-cream/40">
      <label class="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle((e.currentTarget as HTMLInputElement).checked)}
          class="mt-1 accent-[var(--color-forest)] w-4 h-4"
        />
        <div class="flex-1">
          <div class="font-medium text-sm">Envolvemos para regalo <span class="text-amber-deep">· ARS 800</span></div>
          <p class="text-xs text-muted mt-1 leading-relaxed">
            Caja kraft con cinta de papel y una tarjeta con tu mensaje. Si lo activás,
            se agrega al envío.
          </p>
        </div>
      </label>
      {enabled && (
        <label class="block">
          <span class="label">Mensaje para la tarjeta</span>
          <textarea
            rows={3}
            maxLength={200}
            class="field resize-none"
            placeholder="Ej.: Para Ana, con cariño. ¡Feliz cumple!"
            value={message}
            onInput={(e) => onMessageChange((e.currentTarget as HTMLTextAreaElement).value)}
          />
          <div class="mt-1.5 text-[11px] text-muted-soft text-right">{message.length} / 200</div>
        </label>
      )}
    </div>
  );
}
