/**
 * Query param used to deep-link to one artwork's modal on the gallery page.
 * Used by home-page sections (and the gallery grid itself) so clicking any
 * piece — wherever it's shown — lands on /gallery with that piece's modal
 * already open.
 */
export const PIECE_PARAM = 'piece';

export function galleryPieceHref(artworkId: string): string {
  return `/gallery?${PIECE_PARAM}=${artworkId}`;
}
