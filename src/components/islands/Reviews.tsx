/** @jsxImportSource preact */
import { useEffect, useMemo, useState } from "preact/hooks";
import type { ReviewSeed } from "../../lib/reviews";

/** Review que vive en runtime (incluye las del usuario, persistidas). */
export interface Review extends ReviewSeed {
  /** id estable para keys y para borrar si fuera necesario. */
  id: string;
  /** true si fue enviada por el usuario actual (vs. seed). */
  esUsuario: boolean;
}

interface Props {
  slug: string;
  nombreProducto: string;
  /** Reseñas seed que ya vienen del frontmatter/build. */
  seed: ReviewSeed[];
}

const STORAGE_KEY = "verdeo:reviews";

type StoreShape = Record<string, Review[]>;

function readUserReviews(slug: string): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoreShape;
    if (!parsed || typeof parsed !== "object") return [];
    const arr = parsed[slug];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (r): r is Review =>
        r &&
        typeof r.autor === "string" &&
        typeof r.comentario === "string" &&
        typeof r.rating === "number" &&
        typeof r.fecha === "string" &&
        r.rating >= 1 &&
        r.rating <= 5,
    );
  } catch {
    return [];
  }
}

function writeUserReviews(slug: string, reviews: Review[]): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: StoreShape = raw ? safeParse(raw) : {};
    parsed[slug] = reviews;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore quota / serialización
  }
}

function safeParse(raw: string): StoreShape {
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" ? (obj as StoreShape) : {};
  } catch {
    return {};
  }
}

/** Estrellas — input radio accesible, navegación por teclado OK. */
function Stars({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  ariaLabel: string;
}) {
  const labels = ["1 estrella", "2 estrellas", "3 estrellas", "4 estrellas", "5 estrellas"];
  return (
    <div
      class="flex items-center gap-1"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={labels[n - 1]}
            onClick={() => onChange(n)}
            class={`text-2xl leading-none transition-transform duration-200 ${
              active ? "text-amber" : "text-muted-soft/40"
            } hover:scale-110 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-forest`}
          >
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5l2.95 6 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.46l6.6-.96L12 2.5z" />
            </svg>
          </button>
        );
      })}
      <span class="sr-only">
        {value} {value === 1 ? "estrella" : "estrellas"}
      </span>
    </div>
  );
}

function formatFecha(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function initials(autor: string): string {
  const parts = autor.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

export default function Reviews({ slug, nombreProducto, seed }: Props) {
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [nombre, setNombre] = useState("");
  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Carga user reviews desde localStorage al montar.
  useEffect(() => {
    setUserReviews(readUserReviews(slug));
    setHydrated(true);
  }, [slug]);

  const allReviews = useMemo<Review[]>(() => {
    const seeded: Review[] = seed.map((r, i) => ({
      ...r,
      id: `seed-${slug}-${i}`,
      esUsuario: false,
    }));
    // Usuario primero, después seed (orden estable por fecha desc como cortesía).
    return [...userReviews, ...seeded];
  }, [slug, seed, userReviews]);

  const promedio = useMemo(() => {
    if (allReviews.length === 0) return 0;
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / allReviews.length) * 10) / 10;
  }, [allReviews]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const nombreTrim = nombre.trim();
    const comentarioTrim = comentario.trim();
    if (nombreTrim.length < 2) {
      setError("Ingresá tu nombre (2 caracteres o más).");
      return;
    }
    if (rating < 1 || rating > 5) {
      setError("Elegí un puntaje entre 1 y 5 estrellas.");
      return;
    }
    if (comentarioTrim.length < 5) {
      setError("Contanos un poco más (al menos 5 caracteres).");
      return;
    }
    if (comentarioTrim.length > 500) {
      setError("El comentario es demasiado largo (máximo 500 caracteres).");
      return;
    }

    const nueva: Review = {
      id: `user-${slug}-${Date.now()}`,
      autor: nombreTrim,
      rating: rating as 1 | 2 | 3 | 4 | 5,
      comentario: comentarioTrim,
      fecha: new Date().toISOString().slice(0, 10),
      esUsuario: true,
    };

    const next = [nueva, ...userReviews];
    setUserReviews(next);
    writeUserReviews(slug, next);

    // Reset form
    setNombre("");
    setComentario("");
    setRating(5);
    setError(null);
  };

  const ratingBreakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 = 1 estrella, ..., index 4 = 5
    allReviews.forEach((r) => {
      const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
      counts[idx] += 1;
    });
    return counts;
  }, [allReviews]);

  return (
    <section
      aria-label={`Reseñas de ${nombreProducto}`}
      class="mx-auto max-w-[1400px] px-5 md:px-10 py-16 md:py-24 border-t border-[var(--color-hairline)]"
    >
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Resumen + form */}
        <div class="lg:col-span-5">
          <div class="eyebrow mb-3">Reseñas</div>
          <h2 class="display text-[32px] md:text-[40px] leading-[1] mb-6">
            Lo que dice quien lo probó
          </h2>

          {/* Promedio + barras */}
          <div class="bezel-outer mb-8">
            <div class="bezel-inner p-6 md:p-7">
              <div class="flex items-baseline gap-3">
                <span class="display text-[44px] md:text-[56px] leading-none tabular-nums">
                  {allReviews.length === 0 ? "—" : promedio.toFixed(1)}
                </span>
                <span class="text-sm text-muted">/ 5</span>
              </div>
              <div class="mt-3 flex items-center gap-1" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = n <= Math.round(promedio);
                  return (
                    <svg
                      viewBox="0 0 24 24"
                      class={`w-5 h-5 ${active ? "text-amber" : "text-muted-soft/30"}`}
                      fill="currentColor"
                      key={n}
                    >
                      <path d="M12 2.5l2.95 6 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.46l6.6-.96L12 2.5z" />
                    </svg>
                  );
                })}
              </div>
              <p class="mt-2 text-sm text-muted">
                {allReviews.length === 0
                  ? "Aún no hay reseñas."
                  : `Basado en ${allReviews.length} reseña${allReviews.length === 1 ? "" : "s"}.`}
              </p>

              {/* Breakdown por estrella */}
              {allReviews.length > 0 && (
                <ul class="mt-5 flex flex-col gap-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingBreakdown[star - 1];
                    const pct =
                      allReviews.length === 0 ? 0 : (count / allReviews.length) * 100;
                    return (
                      <li
                        key={star}
                        class="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-xs"
                      >
                        <span class="text-muted w-4 text-right">{star}</span>
                        <span
                          class="h-1.5 rounded-full bg-linen overflow-hidden"
                          aria-hidden="true"
                        >
                          <span
                            class="block h-full bg-forest transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        <span class="text-muted tabular-nums w-6 text-right">
                          {count}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            class="bezel-outer"
            aria-label="Dejar una reseña"
          >
            <div class="bezel-inner p-6 md:p-7">
              <div class="display text-[20px] mb-1">Dejar una reseña</div>
              <p class="text-xs text-muted mb-5 leading-relaxed">
                Tu opinión ayuda a quien está decidiendo. Sé honesto y respetuoso.
              </p>

              <div class="mb-4">
                <label for="rev-nombre" class="label">Tu nombre</label>
                <input
                  id="rev-nombre"
                  type="text"
                  class="field"
                  placeholder="Ej.: Lucía"
                  value={nombre}
                  onInput={(e) => setNombre((e.currentTarget as HTMLInputElement).value)}
                  maxLength={60}
                  required
                />
              </div>

              <div class="mb-4">
                <span class="label">Puntaje</span>
                <Stars
                  value={rating}
                  onChange={setRating}
                  ariaLabel="Elegí un puntaje de 1 a 5 estrellas"
                />
              </div>

              <div class="mb-5">
                <label for="rev-comentario" class="label">Comentario</label>
                <textarea
                  id="rev-comentario"
                  class="field resize-none"
                  rows={4}
                  placeholder="Contanos qué te pareció…"
                  value={comentario}
                  onInput={(e) => setComentario((e.currentTarget as HTMLTextAreaElement).value)}
                  maxLength={500}
                  required
                />
                <div class="mt-1.5 text-[11px] text-muted-soft text-right">
                  {comentario.length} / 500
                </div>
              </div>

              {error && (
                <p class="mb-4 text-xs text-amber-deep" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" class="btn-primary w-full justify-center">
                Publicar reseña
              </button>

              <p class="mt-3 text-[11px] text-muted-soft leading-relaxed">
                Esta tienda es demo: tu reseña queda guardada sólo en tu navegador
                (localStorage). No se envía a ningún servidor.
              </p>
            </div>
          </form>
        </div>

        {/* Lista */}
        <div class="lg:col-span-7">
          {!hydrated && allReviews.length === 0 ? (
            <div class="text-muted">Cargando reseñas…</div>
          ) : allReviews.length === 0 ? (
            <div class="bezel-outer">
              <div class="bezel-inner p-8 md:p-10 text-center">
                <div class="display text-[28px] md:text-[36px] leading-[1.05] mb-3">
                  Sé el primero en dejar una review
                </div>
                <p class="text-muted max-w-[44ch] mx-auto leading-relaxed">
          Todavía nadie escribió sobre {nombreProducto.toLowerCase()}. Si lo
                  probaste, contanos qué te pareció.
                </p>
              </div>
            </div>
          ) : (
            <ul class="flex flex-col gap-4">
              {allReviews.map((r) => (
                <li
                  key={r.id}
                  class={`bezel-outer ${r.esUsuario ? "ring-1 ring-[var(--color-amber)]/30" : ""}`}
                >
                  <div class="bezel-inner p-5 md:p-6">
                    <div class="flex items-start gap-4">
                      <div
                        class="w-11 h-11 shrink-0 rounded-full bg-forest text-cream inline-flex items-center justify-center text-sm font-medium"
                        aria-hidden="true"
                      >
                        {initials(r.autor)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-medium">{r.autor}</span>
                          {r.esUsuario && (
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-amber)]/15 text-[10px] uppercase tracking-[0.18em] text-amber-deep">
                              Tuya
                            </span>
                          )}
                          <span class="text-xs text-muted-soft">
                            {formatFecha(r.fecha)}
                          </span>
                        </div>
                        <div
                          class="mt-1 flex items-center gap-0.5"
                          aria-label={`${r.rating} de 5 estrellas`}
                        >
                          {[1, 2, 3, 4, 5].map((n) => {
                            const active = n <= r.rating;
                            return (
                              <svg
                                viewBox="0 0 24 24"
                                class={`w-3.5 h-3.5 ${active ? "text-amber" : "text-muted-soft/30"}`}
                                fill="currentColor"
                                key={n}
                                aria-hidden="true"
                              >
                                <path d="M12 2.5l2.95 6 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.1 1.13-6.58L2.45 9.46l6.6-.96L12 2.5z" />
                              </svg>
                            );
                          })}
                        </div>
                        <p class="mt-3 text-sm text-ink/90 leading-relaxed">
                          {r.comentario}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
