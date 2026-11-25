export const WIDE = 900;

export const canFilm = ({ width, webgl }) => width >= WIDE && webgl;

export function hasWebgl() {
    try {
        return Boolean(document.createElement('canvas').getContext('webgl2'));
    } catch {
        return false;
    }
}

/** How far through the scroll track the viewport is, from 0 to 1. */
export const progressOf = ({ top, height }, viewport) =>
    Math.min(1, Math.max(0, -top / Math.max(1, height - viewport)));
