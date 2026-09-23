/**
 * Parses coordinate strings in multiple formats:
 *
 *   DD:  "27.6790"           → 27.6790
 *   DMM: "27°40.74'N"        → 27.6790
 *   DMS: "27°40'44.4\"N"     → 27.6790
 *   Plain number: 27.6790    → 27.6790
 *
 * Handles S / W hemispheres (returns negative).
 */

export function parseCoordinate(input: string): number | null {
  if (!input) return null;

  // Normalize fancy quotes
  const trimmed = input.trim().replace(/[""]/g, '"').replace(/['']/g, "'");

  // Plain number: 27.6790 or -27.6790
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // DMS: 27°40'44.4"N  OR  27 40 44.4 N
  const dms = trimmed.match(
    /^(-?\d+(?:\.\d+)?)\s*[°\s]\s*(\d+(?:\.\d+)?)\s*['\s]\s*(\d+(?:\.\d+)?)\s*["\s]*\s*([NSEWnsew])?$/
  );
  if (dms) {
    const deg = parseFloat(dms[1]);
    const min = parseFloat(dms[2]);
    const sec = parseFloat(dms[3]);
    const dir = dms[4]?.toUpperCase();
    let val = Math.abs(deg) + min / 60 + sec / 3600;
    if (deg < 0 || dir === 'S' || dir === 'W') val = -val;
    return val;
  }

  // DMM: 27°40.74'N  OR  27 40.74 N
  const dmm = trimmed.match(
    /^(-?\d+(?:\.\d+)?)\s*[°\s]\s*(\d+(?:\.\d+)?)\s*['\s]*\s*([NSEWnsew])?$/
  );
  if (dmm) {
    const deg = parseFloat(dmm[1]);
    const min = parseFloat(dmm[2]);
    const dir = dmm[3]?.toUpperCase();
    let val = Math.abs(deg) + min / 60;
    if (deg < 0 || dir === 'S' || dir === 'W') val = -val;
    return val;
  }

  return null;
}

export function toDD(value: number): string {
  return value.toFixed(6);
}

export function toDMM(value: number, type: 'lat' | 'lng'): string {
  const dir =
    type === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${deg}°${min.toFixed(4)}'${dir}`;
}

export function formatDD(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}