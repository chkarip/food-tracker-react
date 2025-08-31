// utils/scrollIntoViewSafe.ts
export function scrollIntoViewSafe(
  headerEl: HTMLElement,
  options?: {
    behavior?: ScrollBehavior;
    topOffset?: number; // sticky bar height
    container?: HTMLElement | null; // explicit scroll container
    forceWindow?: boolean; // NEW: ignore containers, always use window
  }
) {
  if (!headerEl) return;

  // Visual debug: briefly highlight the headerEl
  headerEl.style.outline = '2px solid #4caf50';
  setTimeout(() => (headerEl.style.outline = ''), 600);

  console.log('[SIV] called', { el: headerEl?.tagName, class: headerEl?.className });

  const behavior = options?.behavior ?? 'smooth';
  const topOffset = options?.topOffset ?? 72; // align with sticky navbar
  const forceWindow = options?.forceWindow ?? false;
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const finalBehavior = prefersReduced ? 'auto' : behavior;

  // Predict expanded bottom by probing details/next sibling; fallback estimate
  const bodyEl =
    (headerEl.parentElement?.querySelector?.('.MuiAccordionDetails-root') as HTMLElement) ||
    (headerEl.nextElementSibling as HTMLElement) ||
    null;
  const estimatedBodyHeight = bodyEl ? (bodyEl.scrollHeight || bodyEl.clientHeight || 0) : 320;

  // Check if page scrolls (only window scrolls on this route)
  const pageScrolls = document.documentElement.scrollHeight > document.documentElement.clientHeight;
  const useWindow = forceWindow || pageScrolls;

  if (useWindow) {
    // Window-scrolling case (always use this on /food route)
    const headerRect = headerEl.getBoundingClientRect();
    const headerAbsTop = window.scrollY + headerRect.top;
    const predictedBottom = headerAbsTop + headerRect.height + estimatedBodyHeight;
    const viewportBottom = window.scrollY + (window.innerHeight || 0);

    const willOverflow = predictedBottom > viewportBottom;
    const headerHiddenBySticky = headerRect.top < topOffset;

    console.log('[SIV] window', {
      headerTop: headerRect.top,
      headerAbsTop,
      estimatedBodyHeight,
      predictedBottom,
      viewportBottom: window.scrollY + window.innerHeight,
      willOverflow,
      headerHiddenBySticky,
      topOffset,
    });

    if (willOverflow || headerHiddenBySticky) {
      const target = Math.max(0, headerAbsTop - topOffset);
      console.log('[SIV] scrollTo', { target, behavior: finalBehavior, scope: 'window' });

      // Disable scroll-snap temporarily
      const prevSnap = (document.documentElement as any).style.scrollSnapType;
      (document.documentElement as any).style.scrollSnapType = 'none';

      window.scrollTo({ top: target, behavior: finalBehavior });

      // Log after scroll to verify movement
      setTimeout(() => {
        console.log('[SIV] window after', window.scrollY, '→', target);
      }, 40);

      // Retry around accordion animation
      setTimeout(() => window.scrollTo({ top: target, behavior: finalBehavior }), 160);
      setTimeout(() => window.scrollTo({ top: target, behavior: 'auto' }), 320);

      // Restore scroll-snap
      setTimeout(() => { (document.documentElement as any).style.scrollSnapType = prevSnap; }, 360);
    }
    return; // CLOSE window branch and return
  }

  // Container-scrolling case (fallback for other routes)
  const getScrollParent = (node: HTMLElement | null): HTMLElement => {
    if (!node || node === document.body) return document.documentElement;
    const isHeaderLike =
      node.classList?.contains?.('collapsible-panel__header') ||
      node.classList?.contains?.('MuiAccordionSummary-root');
    if (isHeaderLike) return getScrollParent(node.parentElement as HTMLElement);

    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const hasScroll = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'hidden';
    const constrained = node.clientHeight > 0 &&
      (node.clientHeight < window.innerHeight || style.maxHeight !== 'none');
    if (hasScroll && constrained) return node;
    return getScrollParent(node.parentElement as HTMLElement);
  };

  const parent = options?.container ?? getScrollParent(headerEl);
  console.log('[SIV] parent', parent === document.documentElement ? 'document' : parent.tagName, parent.className);

  const containerRect = parent.getBoundingClientRect();
  const headerRect = headerEl.getBoundingClientRect();

  // Position relative to container scroll
  const headerRelTop = headerRect.top - containerRect.top + parent.scrollTop;
  const predictedBottom = headerRelTop + headerEl.offsetHeight + estimatedBodyHeight;

  const containerBottom = parent.scrollTop + parent.clientHeight;

  const willOverflow = predictedBottom > containerBottom;
  const headerHiddenBySticky = headerRelTop < topOffset;

  console.log('[SIV] container', {
    headerRelTop,
    headerHeight: headerEl.offsetHeight,
    estimatedBodyHeight,
    predictedBottom,
    containerTop: parent.scrollTop,
    containerBottom,
    willOverflow,
    headerHiddenBySticky,
    topOffset,
  });

  if (willOverflow || headerHiddenBySticky) {
    const target = Math.max(0, headerRelTop - topOffset);
    console.log('[SIV] scrollTo', { target, behavior: finalBehavior, scope: 'container' });

    // Disable scroll-snap temporarily
    const prevSnap = (parent as any).style.scrollSnapType;
    (parent as any).style.scrollSnapType = 'none';

    parent.scrollTo({ top: target, behavior: finalBehavior });

    // Log after scroll to verify movement
    setTimeout(() => {
      console.log('[SIV] after scroll', {
        intended: target,
        now: parent.scrollTop,
        canScroll: parent.scrollHeight > parent.clientHeight
      });

      // Force scrollTop if it didn't move
      if (Math.abs(parent.scrollTop - target) > 2) {
        parent.scrollTop = target;
        setTimeout(() => {
          console.log('[SIV] forced scrollTop', { now: parent.scrollTop, target });
        }, 16);
      }
    }, 50);

    // Restore scroll-snap
    setTimeout(() => { (parent as any).style.scrollSnapType = prevSnap; }, 360);
  }
}
