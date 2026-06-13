// ── Lightbox 純粋計算ヘルパー ────────────────────────────────────────
// DOM/イベントに依存しないズーム・パン・インデックス計算。
// lightbox.ts の巨大クロージャから切り出してテスト可能にする（挙動は不変）。

/** 値を [min, max] にクランプ */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 配列インデックスを 0..length-1 に環状で巡回させる（負値・超過に対応） */
export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

/** ズーム倍率を [min, max] にクランプ */
export function clampZoom(scale: number, min: number, max: number): number {
  return clamp(scale, min, max);
}

/**
 * パンの平行移動量をクランプする。
 * スケール後の画像がビューポートからはみ出した分だけ移動を許可する。
 */
export function clampPan(
  tx: number,
  ty: number,
  scaledW: number,
  scaledH: number,
  vw: number,
  vh: number
): { x: number; y: number } {
  const maxTx = Math.max(0, (scaledW - vw) / 2);
  const maxTy = Math.max(0, (scaledH - vh) / 2);
  return { x: clamp(tx, -maxTx, maxTx), y: clamp(ty, -maxTy, maxTy) };
}

/**
 * 指定点 (px, py) を視覚的に固定したままズームした後の {scale, tx, ty} を返す。
 * newScale は呼び出し側でクランプ済みの値を渡す（クランプ後の平行移動制限は clampPan で別途行う）。
 */
export function zoomToPoint(params: {
  px: number;
  py: number;
  vcx: number;
  vcy: number;
  oldScale: number;
  newScale: number;
  tx: number;
  ty: number;
}): { scale: number; tx: number; ty: number } {
  const { px, py, vcx, vcy, oldScale, newScale, tx, ty } = params;
  const relX = (px - vcx - tx) / oldScale;
  const relY = (py - vcy - ty) / oldScale;
  return {
    scale: newScale,
    tx: px - vcx - relX * newScale,
    ty: py - vcy - relY * newScale
  };
}

/**
 * 水平スワイプ量から進む方向を返す。
 * 左スワイプ（deltaX < 0）→ +1（次へ）、右スワイプ → -1（前へ）、閾値以下 → 0。
 */
export function swipeDirection(deltaX: number, threshold: number): -1 | 0 | 1 {
  if (Math.abs(deltaX) <= threshold) return 0;
  return deltaX < 0 ? 1 : -1;
}
