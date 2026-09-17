/**
 * Reseñas seed por producto.
 *
 * La tienda es demo: cada producto tiene 3-5 reseñas hardcoded para que la
 * sección se vea siempre con vida. Las reseñas del usuario se guardan aparte
 * (localStorage, namespace `verdeo:reviews`) y se mergen en runtime desde
 * el island Preact correspondiente.
 *
 * Las reseñas respetan el tono Verdeo: ninguna palabra en mayúsculas,
 * ninguna exageración de marketing, sin emoji. Sin "5 estrellas" obvias
 * — algunas son 4, una es 3 con feedback honesto.
 */

export interface ReviewSeed {
  /** Autor visible. */
  autor: string;
  /** 1-5. */
  rating: 1 | 2 | 3 | 4 | 5;
  /** Comentario (1-3 oraciones). */
  comentario: string;
  /** ISO date (YYYY-MM-DD). Orden estable, más recientes arriba. */
  fecha: string;
}

/** Mapa slug → reseñas seed (al menos 3 por producto). */
export const REVIEWS_SEED: Record<string, ReviewSeed[]> = {
  "vela-citricos-romero": [
    {
      autor: "Lucía P.",
      rating: 5,
      comentario:
        "Me levanta la mañana. La enciendo cuando arranco con el café y la cocina queda oliendo a romero fresco por un rato largo.",
      fecha: "2026-08-12",
    },
    {
      autor: "Martín R.",
      rating: 4,
      comentario:
        "Aroma fuerte y honesto, no ese olor dulce artificial que venden en otros lados. Arde parejo, sin tunel.",
      fecha: "2026-07-30",
    },
    {
      autor: "Carolina V.",
      rating: 5,
      comentario:
        "Es la segunda que compro. La primera me duró casi dos meses usándola un rato cada día.",
      fecha: "2026-06-18",
    },
  ],
  "vela-lavanda-cedro": [
    {
      autor: "Florencia M.",
      rating: 5,
      comentario:
        "Lavanda real, no sintética. Antes de dormir me relaja sin empalagar.",
      fecha: "2026-09-02",
    },
    {
      autor: "Diego S.",
      rating: 4,
      comentario:
        "Me gusta el cedro de fondo. Es un aroma serio, va bien en el living.",
      fecha: "2026-08-21",
    },
    {
      autor: "Ana L.",
      rating: 5,
      comentario:
        "La vela más linda que tengo. El frasco lo reusé para un ramo seco.",
      fecha: "2026-07-05",
    },
  ],
  "vela-vainilla-sandalo": [
    {
      autor: "Sofía Q.",
      rating: 5,
      comentario:
        "Dulce sin ser empalagoso. La compré para el escritorio y rinde un montón.",
      fecha: "2026-08-25",
    },
    {
      autor: "Pablo H.",
      rating: 4,
      comentario:
        "Vainilla cálida con el sándalo que le da profundidad. No es la típica vela de repostería.",
      fecha: "2026-07-14",
    },
    {
      autor: "Rocío T.",
      rating: 3,
      comentario:
        "Está buena pero el aroma es bastante suave. Si te gustan los aromas intensos no es para vos.",
      fecha: "2026-06-02",
    },
  ],
  "vela-verbena-salvia": [
    {
      autor: "Mariana C.",
      rating: 5,
      comentario:
        "Herbosa y limpia. Me acuerdo del jardín de mi abuela. La compro seguido.",
      fecha: "2026-09-10",
    },
    {
      autor: "Joaquín D.",
      rating: 4,
      comentario:
        "Buena para el baño. Se nota el herbal pero no tapa otros aromas.",
      fecha: "2026-08-04",
    },
    {
      autor: "Camila N.",
      rating: 5,
      comentario:
        "Verdeo no falla. La presentación en papel kraft es un detalle que valoro.",
      fecha: "2026-06-22",
    },
  ],
  "vela-pequena-soja": [
    {
      autor: "Esteban F.",
      rating: 4,
      comentario:
        "Ideal para probar aromas sin gastar de más. Después compré la grande.",
      fecha: "2026-08-18",
    },
    {
      autor: "Victoria G.",
      rating: 5,
      comentario:
        "Me la llevé de viaje. Chiquita, práctica y con la misma calidad que las grandes.",
      fecha: "2026-07-09",
    },
    {
      autor: "Lautaro B.",
      rating: 4,
      comentario:
        "Cera de soja que se ve y se nota. Pabilo de algodón, sin plomo.",
      fecha: "2026-05-30",
    },
  ],
  "difusor-bosque": [
    {
      autor: "Josefina A.",
      rating: 5,
      comentario:
        "Huele a pino de verdad. Las varillas de ratán andan mejor que las de mimbre que probé antes.",
      fecha: "2026-09-01",
    },
    {
      autor: "Manuel O.",
      rating: 5,
      comentario:
        "Dura semanas con intensidad pareja. Reutilizo el frasco para un pequeño plantín.",
      fecha: "2026-08-12",
    },
    {
      autor: "Inés K.",
      rating: 4,
      comentario:
        "Aroma profundo, ideal para invierno. En verano queda un poco intenso.",
      fecha: "2026-07-03",
    },
  ],
  "difusor-hogar": [
    {
      autor: "Bárbara E.",
      rating: 5,
      comentario:
        "El difusor que pongo en la entrada. Todo el que llega pregunta qué es.",
      fecha: "2026-08-29",
    },
    {
      autor: "Tomás I.",
      rating: 4,
      comentario:
        "Suave y limpio. No compite con la comida si lo ponés cerca de la cocina.",
      fecha: "2026-07-18",
    },
    {
      autor: "Paula J.",
      rating: 5,
      comentario:
        "De los mejores aromas de la línea. Lo voy a repetir.",
      fecha: "2026-06-11",
    },
  ],
  "difusor-mini-jazmin": [
    {
      autor: "Natalia W.",
      rating: 5,
      comentario:
        "Lo tengo en el baño. El jazmín no es empalagoso, está bien balanceado.",
      fecha: "2026-08-22",
    },
    {
      autor: "Federico Z.",
      rating: 4,
      comentario:
        "Chico pero rinde. Para espacios chicos va perfecto.",
      fecha: "2026-07-26",
    },
    {
      autor: "Agustina R.",
      rating: 3,
      comentario:
        "Está bien pero el aroma es bastante sutil. Si te gustan intensos mejor otro.",
      fecha: "2026-05-15",
    },
  ],
  "jabon-avena-lavanda": [
    {
      autor: "María V.",
      rating: 5,
      comentario:
        "Es el único jabón que no me reseca la piel. Lo uso en la cara incluso.",
      fecha: "2026-09-05",
    },
    {
      autor: "Lucas P.",
      rating: 5,
      comentario:
        "Apto para mi nena de 4 años. El aroma es delicado, no la invade.",
      fecha: "2026-08-17",
    },
    {
      autor: "Julieta S.",
      rating: 4,
      comentario:
        "La avena se ve en la pastilla, se nota que es artesanal. Dura bastante.",
      fecha: "2026-06-29",
    },
  ],
  "jabon-calendula-miel": [
    {
      autor: "Carla M.",
      rating: 5,
      comentario:
        "La miel le da una espuma cremosa. Es el jabón que más rápido gasté en la casa.",
      fecha: "2026-08-30",
    },
    {
      autor: "Ramiro G.",
      rating: 4,
      comentario:
        "Caléndula real, la pastilla tiene pétalos. Aroma cálido sin ser fuerte.",
      fecha: "2026-07-12",
    },
    {
      autor: "Silvina D.",
      rating: 5,
      comentario:
        "Después de usarlo la piel queda suave y sin tirantez. Voy por el tercero.",
      fecha: "2026-06-05",
    },
  ],
  "jabon-carbon-tea-tree": [
    {
      autor: "Eugenia L.",
      rating: 5,
      comentario:
        "Para piel con granitos es una diferencia real. Lo uso en la espalda y en la cara.",
      fecha: "2026-09-08",
    },
    {
      autor: "Hernán C.",
      rating: 4,
      comentario:
        "El carbón se nota. El aroma a tea tree es medicinal, eso me gusta.",
      fecha: "2026-08-02",
    },
    {
      autor: "Olivia F.",
      rating: 5,
      comentario:
        "Muy buen jabón. Después de probar otros vuelvo siempre a Verdeo.",
      fecha: "2026-07-19",
    },
  ],
  "jabon-rosa-mosqueta": [
    {
      autor: "Daniela N.",
      rating: 5,
      comentario:
        "Rosa mosqueta de verdad, no sintético. La piel queda nutrida.",
      fecha: "2026-08-26",
    },
    {
      autor: "Sergio U.",
      rating: 4,
      comentario:
        "Mi pareja lo usa para las manos después del taller. Le va muy bien.",
      fecha: "2026-07-22",
    },
    {
      autor: "Micaela Y.",
      rating: 5,
      comentario:
        "El aroma es suave pero persistente. Me gusta para la ducha de la mañana.",
      fecha: "2026-06-08",
    },
  ],
  "pano-cocina-algodon": [
    {
      autor: "Adriana B.",
      rating: 5,
      comentario:
        "Absorben muchísimo. Los lavo a máquina y siguen como nuevos.",
      fecha: "2026-09-03",
    },
    {
      autor: "Gonzalo E.",
      rating: 5,
      comentario:
        "Crudos, sin tintes. Para secar frutas y verduras son ideales.",
      fecha: "2026-08-08",
    },
    {
      autor: "Lorena H.",
      rating: 4,
      comentario:
        "Pack de dos a buen precio. La bolsa de papel kraft es un detalle lindo.",
      fecha: "2026-06-26",
    },
  ],
  "set-repasadores-lino": [
    {
      autor: "Pilar K.",
      rating: 5,
      comentario:
        "El lino es noble. Después de muchos lavados están más lindos que nuevos.",
      fecha: "2026-08-31",
    },
    {
      autor: "Andrés M.",
      rating: 4,
      comentario:
        "Buenos repasadores, secos al tacto. El tamaño es cómodo.",
      fecha: "2026-07-15",
    },
    {
      autor: "Sabrina O.",
      rating: 5,
      comentario:
        "Tres repasadores con distintos tramados. Bonitos para dejar a la vista.",
      fecha: "2026-06-01",
    },
  ],
  "toalla-bano-algodon": [
    {
      autor: "Mariana Q.",
      rating: 5,
      comentario:
        "Algodón orgánico se nota en el tacto. Absorbe y seca rápido.",
      fecha: "2026-09-06",
    },
    {
      autor: "Iván R.",
      rating: 4,
      comentario:
        "Buen gramaje, no es finita. El color crudo queda bien en cualquier baño.",
      fecha: "2026-08-19",
    },
    {
      autor: "Roxana S.",
      rating: 5,
      comentario:
        "Toallón grande, abriga bien. Lo lavé varias veces y no encogió.",
      fecha: "2026-07-04",
    },
  ],
};

/** Devuelve reseñas seed para un slug. Si el slug no tiene reseñas, devuelve []. */
export function getReviewsSeed(slug: string): ReviewSeed[] {
  return REVIEWS_SEED[slug] ?? [];
}

/** Promedio redondeado a 1 decimal. Si no hay reseñas, devuelve 0. */
export function promedioRating(reviews: ReadonlyArray<{ rating: number }>): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
