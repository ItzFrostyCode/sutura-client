import L from 'leaflet';

// Leaflet's public .d.ts doesn't declare these — they're genuinely private,
// underscore-prefixed internals we're patching on purpose (see the comment
// below). Typed here instead of `any` so the cast still catches a typo/shape
// change, even though the fields themselves aren't part of Leaflet's public API.
interface PatchedDomUtil {
  _patched_pos?: boolean;
  _patched_set_pos?: boolean;
}
interface PatchedMapProto {
  _patched_pane?: boolean;
  _patched_zoom_end?: boolean;
  _mapPane?: HTMLElement;
  _container?: HTMLElement;
  _animatingZoom?: boolean;
  _getMapPanePos?: (this: L.Map & PatchedMapProto) => L.Point;
  _onZoomTransitionEnd?: (this: L.Map & PatchedMapProto) => void;
}

// Defensive monkeypatch for Leaflet in React single-page apps (SPA)
// Prevents "Cannot read properties of undefined (reading '_leaflet_pos')"
// when components unmount during active zoom/pan animations.
//
// This is a LAST-RESORT safety net, not the primary fix. The real fix is
// every map component (BranchesMap/DiscoveryMap/LocationPicker/
// SingleBranchMap) calling `map.stop()` in its own unmount cleanup
// (`useEffect` return), which cancels an in-flight animation *before*
// React tears the pane down — that's what should actually prevent this
// crash in normal use. This patch exists for whatever that per-component
// cleanup can't catch (e.g. a fast double-unmount, a future map component
// that forgets the cleanup). Because it patches Leaflet's underscore-
// prefixed *private* methods (`_getMapPanePos`, `_onZoomTransitionEnd`),
// it is inherently fragile across Leaflet versions — a prior attempt at
// this same patch overrode `_move` and broke its internal `_moveStart()
// .._move()._moveEnd()` chaining (that override has been removed; only
// the null-guards below remain). If Leaflet is ever upgraded, re-verify
// this file still does something useful before assuming it does.
if (typeof window !== 'undefined' && L) {
  const domUtil = L.DomUtil as typeof L.DomUtil & PatchedDomUtil;

  // 1. Guard DomUtil.getPosition against null/undefined elements
  // This is the direct root cause of "_leaflet_pos" crash when map is unmounted
  if (domUtil && !domUtil._patched_pos) {
    domUtil._patched_pos = true;
    const origGetPosition = L.DomUtil.getPosition;
    L.DomUtil.getPosition = function (el: HTMLElement) {
      if (!el || typeof el !== 'object') {
        return new L.Point(0, 0);
      }
      try {
        return origGetPosition.call(this, el) || new L.Point(0, 0);
      } catch {
        return new L.Point(0, 0);
      }
    };
  }

  // 2. Guard DomUtil.setPosition against null/undefined elements
  if (domUtil && !domUtil._patched_set_pos) {
    domUtil._patched_set_pos = true;
    const origSetPosition = L.DomUtil.setPosition;
    L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point) {
      if (!el || typeof el !== 'object') {
        return;
      }
      try {
        origSetPosition.call(this, el, point);
      } catch {
        // Safe fallback on detached elements
      }
    };
  }

  const mapProto = L.Map?.prototype as (L.Map & PatchedMapProto) | undefined;

  // 3. Guard Map.prototype._getMapPanePos when map pane is unmounted
  if (mapProto && !mapProto._patched_pane) {
    mapProto._patched_pane = true;
    const origGetMapPanePos = mapProto._getMapPanePos;
    mapProto._getMapPanePos = function () {
      if (!this._mapPane) return new L.Point(0, 0);
      try {
        return origGetMapPanePos ? origGetMapPanePos.call(this) : new L.Point(0, 0);
      } catch {
        return new L.Point(0, 0);
      }
    };
  }

  // 4. Guard Map.prototype._onZoomTransitionEnd against execution after unmount
  if (mapProto && !mapProto._patched_zoom_end) {
    mapProto._patched_zoom_end = true;
    const origOnZoomTransitionEnd = mapProto._onZoomTransitionEnd;
    mapProto._onZoomTransitionEnd = function () {
      if (!this._mapPane || !this._container) {
        this._animatingZoom = false;
        return;
      }
      try {
        if (origOnZoomTransitionEnd) {
          origOnZoomTransitionEnd.call(this);
        }
      } catch {
        this._animatingZoom = false;
      }
    };
  }
}

export default L;
export * from 'leaflet';
