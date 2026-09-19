/** @jsxImportSource preact */
import { stockLabel, stockLabelTexto, type StockLabel } from "../../lib/site";

/**
 * Stock badge — pill que dice "En stock" / "Pocas unidades" / "Sin stock".
 * Se usa tanto en cards como en la ficha.
 *
 * Si `variantes` está presente, agrega un +info a la etiqueta para dirigir
 * al selector de variantes.
 */
interface Props {
  stock: number;
  stockBajo?: number;
  variantesCount?: number;
}

export default function StockBadge({ stock, stockBajo = 3, variantesCount }: Props) {
  const label: StockLabel = stockLabel(stock, stockBajo);
  const texto = stockLabelTexto(label);

  const style =
    label === "out"
      ? "bg-amber-deep/10 text-amber-deep border-amber-deep/30"
      : label === "low"
        ? "bg-amber/15 text-amber-deep border-amber/40"
        : "bg-forest/10 text-forest border-forest/30";

  return (
    <span
      class={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${style} text-[10px] uppercase tracking-[0.18em]`}
      aria-label={`Disponibilidad: ${texto}`}
    >
      <svg viewBox="0 0 24 24" class="w-3 h-3" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="6" />
      </svg>
      {texto}
      {typeof variantesCount === "number" && variantesCount > 1 && (
        <span class="font-medium">· {variantesCount} variantes</span>
      )}
    </span>
  );
}
