/**
 * dsh-chat-tools — browser half (hand-written bundle, no build step).
 *
 * Two features, both registered into the right-aligned session-header
 * utilities slot (conversation.session.header.utilities, session scope):
 *
 *  1. A width slider (top right) that adjusts the chat column width by
 *     overriding the official --dsh-chat-content-width variable on the
 *     ConversationRoot element ([data-phase]). The input card follows
 *     automatically (its max-width derives from the same variable).
 *
 *  2. A "提问历史" dropdown: clicking the button opens a popover menu right
 *     below it (not a fixed right-edge panel, so it never covers other
 *     sidebar/overlay plugins). Every user message is listed (newest
 *     first), each entry on one line with an ellipsis, the menu width is
 *     adjustable via its own slider, and clicking an entry scrolls the
 *     conversation to that question using the official
 *     data-chat-anchor-key attribute on each message row.
 *
 * The bundle speaks the shipped module-loader format and only requires
 * `react`; no other dependency, no TS/JSX, no build step.
 */
window.__ModuleLoader__.load({
	id: "dsh-chat-tools",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var React = require("react");

		// ── injected styles (guarded by a plugin-css tag, like shipped bundles) ──
		var CSS_ID = "dsh-chat-tools/styles";
		var CSS = [
			/* Column width: override the official content-width variable on the
			   conversation root element. Same specificity as the shipped class,
			   later in the cascade (our <style> is appended at runtime), and
			   !important guards against reorder. */
			"[data-phase]{--dsh-chat-content-width:var(--dsh-chat-tools-width,748px)!important}",
			/* Left alignment: hug the left edge but clear the 50px outline rail
			   band. The message column's left edge sits at scrollBody.left +
			   padding-left (clearance + 16) + margin-left; the rail covers
			   [scrollBody.left+2, +52], so margin-left must push the column past
			   the rail's right edge (52px) with a small 4px gap. */
			"[data-phase][data-dshct-align='left'] [data-chat-flow]{margin-left:calc(52px - var(--dsh-composer-side-clearance,16px) - 16px + 4px)!important;margin-right:auto!important}",
			/* Header controls */
			".dshct-bar{position:relative;display:inline-flex;align-items:center;gap:8px;margin-left:8px}",
			".dshct-toggle{min-height:24px;padding:2px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer}",
			".dshct-toggle:hover,.dshct-toggle:focus-visible{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}",
			".dshct-toggleOpen{color:var(--dsw-alias-accent,#4f7cff);border-color:var(--dsw-alias-accent,#4f7cff)}",
			/* Dropdown popover: anchored under the header bar, never fixed to the
			   viewport edge, so it floats above the page content instead of
			   covering sidebar/overlay plugins. Background is forced OPAQUE:
			   --dsw-alias-bg-layer-1 can be translucent in some themes, so we
			   paint an opaque base color underneath it (gradient layering). */
			".dshct-menu{position:absolute;top:calc(100% + 6px);right:0;z-index:120;display:flex;flex-direction:column;box-sizing:border-box;min-width:220px;max-width:min(620px,calc(100vw - 32px));max-height:min(440px,calc(100vh - 120px));background-color:var(--dsw-alias-bg-base,#fff);background-image:linear-gradient(var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:var(--dsw-shadow-lv3,0 8px 30px rgba(0,0,0,.18));overflow:hidden}",
			".dshct-menuHead{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}",
			".dshct-menuTitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);flex:none}",
			/* Left-edge drag handle: widen/narrow the dropdown by dragging it. */
			".dshct-resize{position:absolute;left:0;top:0;bottom:0;width:7px;cursor:col-resize;touch-action:none;z-index:2;border-top-left-radius:12px;border-bottom-left-radius:12px}",
			".dshct-resize:hover{background:var(--dsw-alias-accent,#4f7cff);opacity:.35}",
			".dshct-resizeActive{background:var(--dsw-alias-accent,#4f7cff);opacity:.5}",
			/* Bottom-edge drag handle: grow/shrink the dropdown height. */
			".dshct-resizeB{position:absolute;left:0;right:0;bottom:0;height:7px;cursor:ns-resize;touch-action:none;z-index:2;border-bottom-left-radius:12px;border-bottom-right-radius:12px}",
			".dshct-resizeB:hover{background:var(--dsw-alias-accent,#4f7cff);opacity:.35}",
			".dshct-resizeBActive{background:var(--dsw-alias-accent,#4f7cff);opacity:.5}",
			".dshct-close{margin-left:auto;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:18px;cursor:pointer;padding:0 4px}",
			".dshct-close:hover{color:var(--dsw-alias-label-primary)}",
			".dshct-list{flex:1 1 auto;min-height:0;overflow-y:auto;padding:6px;margin:0;list-style:none}",
			/* UI-tune dropdown (width + alignment) */
			".dshct-uiRow{display:flex;align-items:center;gap:10px;padding:8px 12px;flex:none}",
			".dshct-uiLabel{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary);flex:none;width:52px}",
			/* Styled range slider: rounded track with a filled progress portion
			   (driven by the --dshct-fill custom property), a round knob, and
			   hover/drag feedback. Colors ride theme tokens. */
			".dshct-uiSlider{flex:1 1 auto;min-width:0;height:20px;-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer;outline:none}",
			".dshct-uiSlider::-webkit-slider-runnable-track{height:6px;border-radius:999px;background:linear-gradient(to right,var(--dsw-alias-accent,#4f7cff) var(--dshct-fill,0%),var(--dsw-alias-fill-l3,var(--dsw-alias-border-l2,rgba(127,127,127,.35))) var(--dshct-fill,0%))}",
			".dshct-uiSlider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;margin-top:-5px;border-radius:50%;background:var(--dsw-alias-bg-base,#fff);border:2px solid var(--dsw-alias-accent,#4f7cff);box-shadow:var(--dsw-shadow-lv1,0 1px 4px rgba(0,0,0,.2));cursor:pointer;transition:transform .12s,box-shadow .12s}",
			".dshct-uiSlider::-webkit-slider-thumb:hover{transform:scale(1.15);box-shadow:var(--dsw-shadow-lv2,0 2px 8px rgba(0,0,0,.25))}",
			".dshct-uiSlider::-webkit-slider-thumb:active{transform:scale(1.25);cursor:grabbing}",
			".dshct-uiSlider:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-accent,#4f7cff) 30%,transparent)}",
			".dshct-uiSlider::-moz-range-track{height:6px;border-radius:999px;background:var(--dsw-alias-fill-l3,var(--dsw-alias-border-l2,rgba(127,127,127,.35)))}",
			".dshct-uiSlider::-moz-range-progress{height:6px;border-radius:999px;background:var(--dsw-alias-accent,#4f7cff)}",
			".dshct-uiSlider::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-bg-base,#fff);border:2px solid var(--dsw-alias-accent,#4f7cff);box-shadow:var(--dsw-shadow-lv1,0 1px 4px rgba(0,0,0,.2));cursor:pointer;transition:transform .12s,box-shadow .12s}",
			".dshct-uiSlider::-moz-range-thumb:hover{transform:scale(1.15)}",
			".dshct-uiSlider::-moz-range-thumb:active{transform:scale(1.25);cursor:grabbing}",
			".dshct-uiValue{font-size:11px;line-height:18px;color:var(--dsw-alias-label-tertiary);flex:none;width:44px;text-align:right;white-space:nowrap}",
			".dshct-uiSeg{display:flex;gap:6px;flex:1 1 auto}",
			".dshct-uiSegBtn{flex:1 1 0;min-height:26px;padding:2px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap}",
			".dshct-uiSegBtn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}",
			".dshct-uiSegBtnActive{color:var(--dsw-alias-accent,#4f7cff);border-color:var(--dsw-alias-accent,#4f7cff)}",
			".dshct-uiDivider{height:1px;background:var(--dsw-alias-border-l1);flex:none}",
			".dshct-item{display:block;box-sizing:border-box;width:100%;padding:6px 8px;border-radius:8px;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dshct-item:hover{background:var(--dsw-alias-fill-l2)}",
			".dshct-item:focus-visible{outline:2px solid var(--dsw-alias-accent,#4f7cff);outline-offset:-2px}",
			/* Question history rows: number badge + item */
			".dshct-qRow{display:flex;align-items:center;gap:6px;border-radius:8px}",
			".dshct-qRow:hover{background:var(--dsw-alias-fill-l2)}",
			".dshct-qNum{flex:none;min-width:24px;padding-left:8px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:18px;text-align:right;font-variant-numeric:tabular-nums}",
			".dshct-qRow .dshct-item{padding:6px 8px 6px 0;flex:1 1 auto;min-width:0}",
			".dshct-qRow:hover .dshct-item{background:transparent}",
			".dshct-itemActive{color:var(--dsw-alias-accent,#4f7cff)}",
			".dshct-qGhost .dshct-item{color:var(--dsw-alias-label-tertiary);font-style:italic}",
			".dshct-qGhost .dshct-item:disabled{opacity:.7;cursor:wait}",
			/* History navigation row: prev/next question buttons */
			".dshct-navRow{display:flex;gap:6px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}",
			".dshct-navBtn{flex:1 1 0;min-height:26px;padding:2px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;cursor:pointer;white-space:nowrap}",
			".dshct-navBtn:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}",
			".dshct-navBtn:disabled{opacity:.4;cursor:default}",
			".dshct-empty{padding:12px 8px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;text-align:center}",
			/* Outline rail on the left edge of the conversation content area:
			   a fixed 50px-wide band that ALWAYS shows the heading structure of
			   the current assistant answer as horizontal ticks (tick length
			   shrinks with heading level: h1 longest … h6 shortest). The ticks
			   are pure visualization — hovering the band opens the full outline
			   panel; jumping happens by clicking entries in that panel. */
			".dshct-rail{position:fixed;z-index:110;width:50px;box-sizing:border-box;pointer-events:auto;padding:6px 0 6px 8px}",
			".dshct-rail:hover{background:var(--dsw-alias-fill-l2,rgba(127,127,127,.12))}",
			/* Outline ticks: rounded-rect bars with a SMALL fixed corner radius.
			   A huge radius (999px) turns short heading bars into fat dots,
			   making bars look thicker than long ones — a small 2px radius keeps
			   every bar a uniform 4px-tall rounded rectangle regardless of its
			   length. The active heading is distinguished by color only. */
			".dshct-railTicks{display:flex;flex-direction:column;align-items:flex-start;gap:9px;pointer-events:none}",
			".dshct-tick{display:block;height:4px;border-radius:2px;flex:none;opacity:1;background:linear-gradient(90deg,var(--dsw-alias-label-tertiary,rgba(120,120,130,.55)) 0%,var(--dsw-alias-label-tertiary,rgba(120,120,130,.25)) 100%);transition:background .15s}",
			".dshct-tickActive{background:linear-gradient(90deg,var(--dsw-alias-accent,#4f7cff) 0%,color-mix(in srgb,var(--dsw-alias-accent,#4f7cff) 40%,transparent) 100%)}",
			".dshct-railPop{position:fixed;z-index:130;display:flex;flex-direction:column;min-width:200px;max-width:340px;max-height:60vh;overflow-y:auto;background-color:var(--dsw-alias-bg-base,#fff);background-image:linear-gradient(var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:var(--dsw-shadow-lv3,0 8px 30px rgba(0,0,0,.18));padding:6px;pointer-events:auto}",
			".dshct-railPopTitle{font-size:11px;font-weight:600;color:var(--dsw-alias-label-tertiary);padding:2px 6px 4px;flex:none}",
			".dshct-railPopItem{display:block;width:100%;box-sizing:border-box;padding:3px 6px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px;text-align:left;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dshct-railPopItem:hover,.dshct-railPopItemActive{background:var(--dsw-alias-fill-l2)}",
			/* Right-side rail for the file markdown preview (better-sidebar):
			   same ticks, same popover, anchored to the preview's right edge.
			   Gradient runs right-to-left to mirror the left rail. */
			".dshct-railR{position:fixed;z-index:110;width:50px;box-sizing:border-box;pointer-events:auto;padding:6px 8px 6px 0}",
			".dshct-railR:hover{background:var(--dsw-alias-fill-l2,rgba(127,127,127,.12))}",
			".dshct-railRTicks{display:flex;flex-direction:column;align-items:flex-end;gap:9px;pointer-events:none}",
			".dshct-railR .dshct-tick{background:linear-gradient(270deg,var(--dsw-alias-label-tertiary,rgba(120,120,130,.55)) 0%,var(--dsw-alias-label-tertiary,rgba(120,120,130,.25)) 100%)}",
			".dshct-railR .dshct-tickActive{background:linear-gradient(270deg,var(--dsw-alias-accent,#4f7cff) 0%,color-mix(in srgb,var(--dsw-alias-accent,#4f7cff) 40%,transparent) 100%)}",
			/* Reduced motion */
			"@media (prefers-reduced-motion:reduce){.dshct-menu{transition:none}}",
		].join("");

		function ensureStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector('style[data-plugin-css="' + CSS_ID + '"]') !== null) return;
			var tag = document.createElement("style");
			tag.dataset.plugin = "dsh-chat-tools";
			tag.dataset.pluginCss = CSS_ID;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		// ── persisted preferences ──
		// Width is stored as a PERCENTAGE (0–100) of the current alignment mode's
		// maximum legal width, never as pixels: the pixel maximum differs between
		// left (fills to the content edge) and center (symmetric margins keep the
		// column clear of the outline rail), so storing pixels would make the
		// percentage drift (e.g. 100% left → 102% center). The percentage keeps
		// the user's intent stable across alignment switches.
		var STORE_KEY = "dsh.chat-tools.prefs";
		var DEFAULT_WIDTH = 748;
		var MENU_HEIGHT_MIN = 200;
		var MENU_HEIGHT_MAX = 600;
		function loadPrefs() {
			try {
				var raw = window.localStorage.getItem(STORE_KEY);
				if (raw) {
					var p = JSON.parse(raw);
					return {
						widthPct: typeof p.widthPct === "number" ? p.widthPct : 0,
						menuWidth: typeof p.menuWidth === "number" ? p.menuWidth : 340,
						menuHeight: typeof p.menuHeight === "number" ? p.menuHeight : 0, // 0 = auto
						align: p.align === "left" ? "left" : "center",
					};
				}
			} catch (e) { /* ignore */ }
			return { widthPct: 0, menuWidth: 340, menuHeight: 0, align: "center" };
		}
		function savePrefs(prefs) {
			try { window.localStorage.setItem(STORE_KEY, JSON.stringify(prefs)); }
			catch (e) { /* ignore */ }
		}

		// ── question history cache ──
		// DSH's session window only keeps recent events in the browser; older
		// questions disappear from the snapshot (they are NOT gone — the host
		// keeps the full log and loadOlder() pages it in). We cache every
		// question we have ever seen, per session, so the history menu stays
		// stable across window paging and reloads. Cached entries that are not
		// in the current window are "ghosts": clicking one triggers a
		// loadOlder() loop until the question lands in the window (or a page
		// cap is hit), then scrolls to it.
		var Q_CACHE_KEY = "dsh.chat-tools.qcache";
		var Q_CACHE_MAX = 500; // questions kept per session
		var LOAD_OLDER_MAX_PAGES = 40; // safety cap for auto-loading
		function loadQCache() {
			try {
				var raw = window.localStorage.getItem(Q_CACHE_KEY);
				if (raw) {
					var p = JSON.parse(raw);
					if (p && typeof p === "object" && typeof p.sessions === "object" && p.sessions !== null) return p.sessions;
				}
			} catch (e) { /* ignore */ }
			return {};
		}
		function saveQCache(sessions) {
			try { window.localStorage.setItem(Q_CACHE_KEY, JSON.stringify({ sessions: sessions })); }
			catch (e) { /* ignore */ }
		}
		/** Merge questions seen in the window into the per-session cache. */
		function mergeQCache(sessions, sessionId, questions) {
			var list = sessions[sessionId];
			if (!Array.isArray(list)) list = [];
			var byKey = {};
			for (var i = 0; i < list.length; i++) byKey[list[i].key] = list[i];
			var changed = false;
			for (var j = 0; j < questions.length; j++) {
				var q = questions[j];
				var existing = byKey[q.key];
				if (!existing) { byKey[q.key] = q; changed = true; }
				// Prefer the window copy when it carries a durable seq (older
				// cache entries may predate the seq field).
				else if (typeof q.seq === "number" && typeof existing.seq !== "number") {
					byKey[q.key] = q; changed = true;
				}
			}
			if (!changed) return sessions;
			var merged = Object.keys(byKey).map(function (k) { return byKey[k]; });
			merged.sort(function (x, y) {
				var xs = typeof x.seq === "number" ? x.seq : Infinity;
				var ys = typeof y.seq === "number" ? y.seq : Infinity;
				return xs - ys;
			});
			if (merged.length > Q_CACHE_MAX) merged = merged.slice(merged.length - Q_CACHE_MAX);
			var next = Object.assign({}, sessions);
			next[sessionId] = merged;
			return next;
		}

		/** Derive the pixel width for the current max: pct% between DEFAULT and max. */
		function widthFromPct(pct, max) {
			return Math.round(DEFAULT_WIDTH + (pct / 100) * Math.max(0, max - DEFAULT_WIDTH));
		}

		/** Extract joined text from a user message's content blocks. */
		function extractText(blocks) {
			var parts = [];
			if (Array.isArray(blocks)) {
				for (var i = 0; i < blocks.length; i++) {
					var b = blocks[i];
					if (b && b.type === "text" && typeof b.text === "string" && b.text) parts.push(b.text);
				}
			}
			return parts.join(" ").replace(/\s+/g, " ").trim();
		}

		/** Safe attribute-value quoting for querySelector. */
		function quoteAttr(value) {
			return '"' + String(value).replace(/["\\]/g, "\\$&") + '"';
		}

		// Scroll animation state for keyboard/nav jumps: a single rAF-driven
		// tween that CANCELS the previous run when a new jump starts. Native
		// smooth scrolling queues competing animations when keys repeat fast,
		// which feels stuck on long sessions; this one always starts fresh from
		// the current position with a fixed, comfortable duration.
		var scrollAnimId = null;
		var scrollAnimPort = null;
		function cancelScrollAnim() {
			if (scrollAnimId !== null) {
				cancelAnimationFrame(scrollAnimId);
				scrollAnimId = null;
			}
			scrollAnimPort = null;
		}
		/** Ease-out-quad: fast start, gentle settle. */
		function easeOutQuad(t) {
			return 1 - (1 - t) * (1 - t);
		}
		/** Animate the scrollport to targetTop; cancels any in-flight tween. */
		function animateScrollTo(port, targetTop) {
			cancelScrollAnim();
			var startTop = port.scrollTop;
			var delta = targetTop - startTop;
			if (Math.abs(delta) < 2) return;
			scrollAnimPort = port;
			var duration = 280;
			var startTime = performance.now();
			function step(now) {
				if (scrollAnimPort !== port) return; // superseded by a newer jump
				var t = Math.min(1, (now - startTime) / duration);
				port.scrollTop = startTop + delta * easeOutQuad(t);
				if (t < 1) {
					scrollAnimId = requestAnimationFrame(step);
				} else {
					scrollAnimId = null;
					scrollAnimPort = null;
				}
			}
			scrollAnimId = requestAnimationFrame(step);
		}

		/**
		 * Scroll the conversation so the row with this anchor key is visible.
		 * @param key - the question's chat anchor key.
		 * @param animated - true for keyboard/nav-button jumps: run the
		 *   interruptible rAF tween (smooth, but never queues). Defaults to
		 *   false → native smooth scrollIntoView (menu clicks).
		 */
		function jumpTo(key, animated) {
			if (typeof document === "undefined") return;
			var el = document.querySelector("[data-chat-anchor-key=" + quoteAttr(key) + "]");
			if (!el) return;
			if (animated) {
				var scrollport = el.closest("[data-conversation-scroll]");
				if (scrollport) {
					var top = el.getBoundingClientRect().top
						- scrollport.getBoundingClientRect().top
						+ scrollport.scrollTop - 16;
					animateScrollTo(scrollport, Math.max(0, top));
					return;
				}
			}
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		}
		// Also stop the tween if the user grabs the scrollbar mid-animation.
		if (typeof document !== "undefined") {
			document.addEventListener("wheel", function () { cancelScrollAnim(); }, { passive: true });
			document.addEventListener("touchstart", function () { cancelScrollAnim(); }, { passive: true });
		}

		/**
		 * A rAF-based pause that lets the browser paint between loadOlder()
		 * pages, keeping the UI responsive during multi-page loading.
		 * @returns Promise resolving after the next animation frame.
		 */
		function yieldFrame() {
			return new Promise(function (resolve) {
				requestAnimationFrame(function () { resolve(); });
			});
		}

		/**
		 * Auto-load older pages until the question's anchor key exists in the
		 * DOM (or the page cap is hit), then scroll to it.
		 * @param session - the SessionFace with loadOlder() (may be undefined).
		 * @param key - the question's chat anchor key.
		 * @param onProgress - optional callback ({ page, found }) for UI feedback.
		 * @returns Promise<boolean> — true when found and scrolled.
		 */
		async function loadOlderAndJump(session, key, onProgress) {
			if (typeof document === "undefined") return false;
			// Already in the window? Jump straight away (instant — this is a
			// keyboard/nav-driven jump, not a leisurely click).
			var el = document.querySelector("[data-chat-anchor-key=" + quoteAttr(key) + "]");
			if (el) {
				jumpTo(key, true);
				if (onProgress) onProgress({ page: 0, found: true });
				return true;
			}
			if (!session || typeof session.loadOlder !== "function") {
				if (onProgress) onProgress({ page: 0, found: false, error: "no-session" });
				return false;
			}
			for (var page = 1; page <= LOAD_OLDER_MAX_PAGES; page++) {
				if (onProgress) onProgress({ page: page, found: false });
				// Let the host page in the next older batch.
				try { await session.loadOlder(); } catch (e) { break; }
				// Give React/DOM a frame to render the prepended rows.
				await yieldFrame();
				await yieldFrame();
				el = document.querySelector("[data-chat-anchor-key=" + quoteAttr(key) + "]");
				if (el) {
					jumpTo(key, true);
					if (onProgress) onProgress({ page: page, found: true });
					return true;
				}
			}
			if (onProgress) onProgress({ page: LOAD_OLDER_MAX_PAGES, found: false, error: "cap" });
			return false;
		}

		/**
		 * Parse Markdown headings from an assistant answer's text blocks.
		 * Returns [{ level: 1..6, text }] in document order. Only ATX-style
		 * headings count; inline formatting marks are stripped from the text.
		 * @param blocks - AssistantBlock[] from an assistant chat node.
		 * @returns heading list.
		 */
		function extractHeadings(blocks) {
			var out = [];
			if (!Array.isArray(blocks)) return out;
			for (var i = 0; i < blocks.length; i++) {
				var b = blocks[i];
				if (!b || b.kind !== "text" || typeof b.text !== "string") continue;
				var lines = b.text.split(/\r?\n/);
				for (var j = 0; j < lines.length; j++) {
					var line = lines[j];
					var m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
					if (!m) continue;
					var text = m[2]
						.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → label
						.replace(/[*_`~]/g, "")                  // inline marks
						.replace(/\s+/g, " ")
						.trim();
					if (text) out.push({ level: m[1].length, text: text });
				}
			}
			return out;
		}

		/** Scroll to a specific heading inside the assistant message row. */
		function jumpToHeading(key, headingText) {
			if (typeof document === "undefined") return;
			var el = document.querySelector("[data-chat-anchor-key=" + quoteAttr(key) + "]");
			if (!el) return;
			// Prefer an exact heading element; fall back to the message row.
			var want = headingText.toLowerCase().replace(/\s+/g, "");
			var headings = el.querySelectorAll("h1,h2,h3,h4,h5,h6");
			for (var i = 0; i < headings.length; i++) {
				var got = (headings[i].textContent || "").toLowerCase().replace(/\s+/g, "");
				if (got === want) {
					headings[i].scrollIntoView({ behavior: "smooth", block: "start" });
					return;
				}
			}
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		}

		/**
		 * The plugin component. Registered into conversation.session.header.utilities
		 * (session scope), so it receives the framework session kit: useSession,
		 * sessionId, etc. It renders the header slider + "提问历史" toggle button,
		 * and — when open — a dropdown menu directly below the button.
		 */
		function ChatTools(props) {
			var useSession = props.useSession;
			// Full snapshot: the dispatching skeleton re-renders on store changes.
			var snapshot = useSession(function (s) { return s; });
			var sessionId = props.sessionId;
			var loadOlderFor = props.loadOlderFor; // (sessionId) => SessionFace | undefined
			var prefsRef = React.useRef(null);
			if (prefsRef.current === null) prefsRef.current = loadPrefs();
			var prefs = prefsRef.current;

			var [widthPct, setWidthPct] = React.useState(prefs.widthPct);
			var [menuWidth, setMenuWidth] = React.useState(prefs.menuWidth);
			var [menuHeight, setMenuHeight] = React.useState(prefs.menuHeight); // 0 = auto
			var [open, setOpen] = React.useState(false);
			var [uiOpen, setUiOpen] = React.useState(false);
			var [align, setAlign] = React.useState(prefs.align);
			// Max width: conversation content area minus the 50px outline rail,
			// computed per alignment mode (see the measure effect below).
			var [maxWidth, setMaxWidth] = React.useState(1280);
			var widthPx = widthFromPct(widthPct, maxWidth);

			// Apply the width/alignment variables to the document root (survives
			// remounts of the conversation column; the injected CSS maps them onto
			// [data-phase]). Alignment rides a data attribute on the phase root so
			// the CSS can target the message column without touching the rail.
			React.useEffect(function () {
				document.documentElement.style.setProperty("--dsh-chat-tools-width", String(widthPx) + "px");
				var root = document.querySelector("[data-phase]");
				if (root) {
					if (align === "left") root.setAttribute("data-dshct-align", "left");
					else root.removeAttribute("data-dshct-align");
				}
				savePrefs({ widthPct: widthPct, menuWidth: menuWidth, menuHeight: menuHeight, align: align });
			}, [widthPx, widthPct, menuWidth, menuHeight, align]);

			// Measure the usable content width. The max depends on alignment:
			// the outline rail occupies [scrollBody.left+2, +52]; the message
			// column sits inside padding-left = clearance + 16 (32 by default).
			//   - left:  margin-left 24px → column left edge at 56px, so it may
			//            fill to the content right edge: W = C - 64 - 24 = C - 88
			//   - center: symmetric margins; to keep the left edge at >= 52px,
			//            each margin must be >= 20px: W = C - 64 - 40 = C - 104
			React.useEffect(function () {
				function measure() {
					var scrollBody = document.querySelector("[data-conversation-scroll]");
					if (!scrollBody) return;
					var c = scrollBody.clientWidth;
					var w = align === "left" ? c - 88 : c - 104;
					setMaxWidth(Math.max(DEFAULT_WIDTH, w));
				}
				measure();
				window.addEventListener("resize", measure);
				return function () { window.removeEventListener("resize", measure); };
			}, [align]);

			// Close either dropdown when clicking elsewhere on the page.
			var barRef = React.useRef(null);
			React.useEffect(function () {
				if (!open && !uiOpen) return;
				function onDocClick(e) {
					if (barRef.current && !barRef.current.contains(e.target)) {
						setOpen(false);
						setUiOpen(false);
					}
				}
				document.addEventListener("mousedown", onDocClick);
				return function () { document.removeEventListener("mousedown", onDocClick); };
			}, [open, uiOpen]);

			// Scroll the question list to the BOTTOM (newest) when the menu
			// opens: the user usually wants the recent questions, and scrolls up
			// only when hunting older ones. Double rAF + a small timeout cover
			// the mount render and any late async item layout.
			var listRef = React.useRef(null);
			React.useEffect(function () {
				if (!open) return;
				var rafs = [];
				var t = setTimeout(function () {
					var el = listRef.current;
					if (el) el.scrollTop = el.scrollHeight;
				}, 60);
				for (var i = 0; i < 2; i++) {
					rafs.push(requestAnimationFrame(function () {
						var el = listRef.current;
						if (el) el.scrollTop = el.scrollHeight;
					}));
				}
				return function () {
					clearTimeout(t);
					for (var j = 0; j < rafs.length; j++) cancelAnimationFrame(rafs[j]);
				};
			}, [open]);

			// Collect user questions in conversation order (oldest first, so the
			// newest question appears at the bottom — natural reading order).
			// Each entry carries its durable seq so cache merges can re-sort
			// correctly when the window only holds the tail of a long session.
			var questions = React.useMemo(function () {
				var chat = snapshot && snapshot.chat;
				var out = [];
				if (chat && chat.order && chat.nodes) {
					var order = chat.order;
					for (var i = 0; i < order.length; i++) {
						var node = chat.nodes.get(order[i]);
						if (!node || node.kind !== "user") continue;
						var text = extractText(node.data && node.data.content);
						if (!text) continue;
						out.push({
							key: node.key,
							text: text,
							seq: typeof node.anchorSeq === "number" ? node.anchorSeq
								: (node.data && typeof node.data.seq === "number" ? node.data.seq : i),
						});
					}
				}
				return out;
			}, [snapshot]);

			// ── question cache: remember every question ever seen, per session ──
			var qCacheRef = React.useRef(null);
			if (qCacheRef.current === null) qCacheRef.current = loadQCache();
			// Merge window questions into the cache (dedupe by anchor key).
			React.useEffect(function () {
				if (!sessionId || questions.length === 0) return;
				var next = mergeQCache(qCacheRef.current, sessionId, questions);
				if (next !== qCacheRef.current) {
					qCacheRef.current = next;
					saveQCache(next);
				}
			}, [sessionId, questions]);

			// Cached questions not present in the current window = "ghosts".
			// They are still shown in the menu (marked), and clicking one
			// auto-loads older pages until it lands, then jumps.
			var cachedForSession = sessionId ? (qCacheRef.current[sessionId] || []) : [];
			var ghostMap = null;
			if (sessionId) {
				ghostMap = {};
				for (var g = 0; g < cachedForSession.length; g++) {
					var gk = cachedForSession[g].key;
					var inWindow = false;
					for (var w = 0; w < questions.length; w++) {
						if (questions[w].key === gk) { inWindow = true; break; }
					}
					if (!inWindow) ghostMap[gk] = true;
				}
			}
			// Full merged list: cached (incl. ghosts) + window, deduped, sorted
			// by durable seq. Sorting (not "window first") keeps the numbering
			// correct when the window only holds the tail of a long session:
			// otherwise early cached questions would be appended AFTER recent
			// window ones and the 1..N labels would be scrambled.
			var allQuestions = React.useMemo(function () {
				var byKey = {};
				var list = [];
				for (var a = 0; a < questions.length; a++) {
					if (!byKey[questions[a].key]) {
						byKey[questions[a].key] = questions[a];
						list.push(questions[a]);
					}
				}
				for (var b = 0; b < cachedForSession.length; b++) {
					if (!byKey[cachedForSession[b].key]) {
						byKey[cachedForSession[b].key] = cachedForSession[b];
						list.push(cachedForSession[b]);
					}
				}
				list.sort(function (x, y) {
					var xs = typeof x.seq === "number" ? x.seq : Infinity;
					var ys = typeof y.seq === "number" ? y.seq : Infinity;
					return xs - ys;
				});
				return list;
			}, [questions, cachedForSession]);

			// Loading state for ghost jumps: { key, page, found, error } | null
			var [ghostLoading, setGhostLoading] = React.useState(null);
			var ghostLoadingRef = React.useRef(null);
			ghostLoadingRef.current = ghostLoading;

			// Click handler: normal jump for window questions; auto-load loop
			// for ghosts (requires the sessions service binding).
			// instant=true (keyboard/nav buttons) jumps with no scroll animation.
			function onQuestionClick(q, qi, instant) {
				if (ghostLoadingRef.current) return; // one load at a time
				setCurrentQ(qi);
				if (!ghostMap || !ghostMap[q.key]) {
					jumpTo(q.key, instant === true);
					return;
				}
				// Ghost: auto-load older pages until the anchor appears.
				var session = typeof loadOlderFor === "function" ? loadOlderFor(sessionId) : undefined;
				setGhostLoading({ key: q.key, page: 0, found: false });
				loadOlderAndJump(session, q.key, function (st) {
					setGhostLoading({ key: q.key, page: st.page, found: st.found, error: st.error });
				}).then(function (ok) {
					// Refresh the merged list after loading so the now-window
					// question stops being marked as a ghost (the snapshot
					// change re-runs the merge effect).
					setTimeout(function () {
						if (ghostLoadingRef.current && ghostLoadingRef.current.key === q.key) setGhostLoading(null);
					}, 600);
				});
			}

			// Current question index for prev/next navigation (0-based; -1 = none).
			// Tracks the last question row above the viewport bottom, so Ctrl+↑/↓
			// navigates relative to where the user is reading.
			var [currentQ, setCurrentQ] = React.useState(-1);
			var currentQRef = React.useRef(-1);
			currentQRef.current = currentQ;

			// Keyboard navigation: Ctrl+↑ previous question, Ctrl+↓ next question.
			// allQuestions / onQuestionClick ride refs so this effect stays cheap.
			var allQRef = React.useRef([]);
			allQRef.current = allQuestions;
			var onQClickRef = React.useRef(function () {});
			onQClickRef.current = onQuestionClick;
			React.useEffect(function () {
				function onKey(e) {
					if (!(e.ctrlKey || e.metaKey)) return;
					if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
					var tag = e.target && e.target.tagName;
					if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) return;
					e.preventDefault();
					var q = currentQRef.current;
					var list = allQRef.current;
					if (e.key === "ArrowUp") {
						if (q > 0 && list[q - 1]) onQClickRef.current(list[q - 1], q - 1, true);
					} else {
						if (q < list.length - 1 && list[q + 1]) onQClickRef.current(list[q + 1], q + 1, true);
					}
				}
				document.addEventListener("keydown", onKey);
				return function () { document.removeEventListener("keydown", onKey); };
			}, []);

			// Track the current question by scroll position (same cadence as the
			// outline update below). IMPORTANT: the index must be relative to
			// allQuestions (the merged full list), because the keyboard shortcut
			// and the nav buttons index into that list — using the window-only
			// `questions` index here would mis-jump on long sessions where the
			// window holds only the tail.
			React.useEffect(function () {
				var ticking = false;
				function update() {
					var scrollBody = document.querySelector("[data-conversation-scroll]");
					if (!scrollBody || allQuestions.length === 0) return;
					var rect = scrollBody.getBoundingClientRect();
					var rows = scrollBody.querySelectorAll("[data-chat-anchor-key]");
					var lastUserKey = null;
					for (var i = 0; i < rows.length; i++) {
						var r = rows[i].getBoundingClientRect();
						if (r.top < rect.bottom - 60) {
							var rowKey = rows[i].getAttribute("data-chat-anchor-key");
							var rowNode = rowKey && snapshot && snapshot.chat && snapshot.chat.nodes.get(rowKey);
							if (rowNode && rowNode.kind === "user") lastUserKey = rowKey;
						}
					}
					if (lastUserKey === null) return;
					for (var j = 0; j < allQuestions.length; j++) {
						if (allQuestions[j].key === lastUserKey) {
							setCurrentQ(j);
							break;
						}
					}
				}
				update();
				var scrollBody = document.querySelector("[data-conversation-scroll]");
				var target = scrollBody || window;
				function onScroll() {
					if (ticking) return;
					ticking = true;
					requestAnimationFrame(function () { ticking = false; update(); });
				}
				target.addEventListener("scroll", onScroll, { passive: true });
				return function () { target.removeEventListener("scroll", onScroll); };
			}, [snapshot, allQuestions]);

			// Drag the menu's left edge to resize it (min 220 / max 620).
			// Hooks stay at the top level; the handle only renders while open.
			var dragRef = React.useRef(null);
			var [dragging, setDragging] = React.useState(false);
			var dragRightRef = React.useRef(0); // menu right edge at drag start
			React.useEffect(function () {
				if (!dragging) return;
				var el = dragRef.current;
				if (!el) return;
				var menuEl = el.closest(".dshct-menu");
				if (!menuEl) return;
				dragRightRef.current = menuEl.getBoundingClientRect().right;
				function onMove(e) {
					var next = Math.min(620, Math.max(220, Math.round(dragRightRef.current - e.clientX)));
					setMenuWidth(next);
				}
				function onUp() {
					setDragging(false);
					document.body.style.cursor = "";
				}
				document.addEventListener("mousemove", onMove);
				document.addEventListener("mouseup", onUp);
				document.body.style.cursor = "col-resize";
				return function () {
					document.removeEventListener("mousemove", onMove);
					document.removeEventListener("mouseup", onUp);
					document.body.style.cursor = "";
				};
			}, [dragging]);

			// Drag the menu's bottom edge to resize its height (200–600px).
			var dragBRef = React.useRef(null);
			var [draggingB, setDraggingB] = React.useState(false);
			var dragTopRef = React.useRef(0); // menu top at drag start
			React.useEffect(function () {
				if (!draggingB) return;
				var el = dragBRef.current;
				if (!el) return;
				var menuEl = el.closest(".dshct-menu");
				if (!menuEl) return;
				dragTopRef.current = menuEl.getBoundingClientRect().top;
				function onMove(e) {
					var next = Math.min(MENU_HEIGHT_MAX, Math.max(MENU_HEIGHT_MIN, Math.round(e.clientY - dragTopRef.current)));
					setMenuHeight(next);
				}
				function onUp() {
					setDraggingB(false);
					document.body.style.cursor = "";
				}
				document.addEventListener("mousemove", onMove);
				document.addEventListener("mouseup", onUp);
				document.body.style.cursor = "ns-resize";
				return function () {
					document.removeEventListener("mousemove", onMove);
					document.removeEventListener("mouseup", onUp);
					document.body.style.cursor = "";
				};
			}, [draggingB]);

			// ── outline rail: headings of the assistant answer currently in view ──
			var [outline, setOutline] = React.useState(null); // { key, headings[] }
			var [railRect, setRailRect] = React.useState(null); // { left, top, height }
			var [hoverIndex, setHoverIndex] = React.useState(-1);
			var [popOpen, setPopOpen] = React.useState(false);
			var popTimerRef = React.useRef(null);
			function popDelayClose() {
				if (popTimerRef.current) clearTimeout(popTimerRef.current);
				popTimerRef.current = setTimeout(function () { setPopOpen(false); }, 140);
			}
			function popCancelClose() {
				if (popTimerRef.current) { clearTimeout(popTimerRef.current); popTimerRef.current = null; }
			}

			// ── right rail: headings of the file markdown preview (better-sidebar
			//    or any other preview rendering MarkdownText h1-h6 in a scrollable
			//    container to the RIGHT of the conversation column) ──
			var [fileOutline, setFileOutline] = React.useState(null); // { headings[] }
			var [fileRailRect, setFileRailRect] = React.useState(null); // { left, top, height }
			var [fileHover, setFileHover] = React.useState(-1);
			var [filePopOpen, setFilePopOpen] = React.useState(false);
			var filePopTimerRef = React.useRef(null);
			// Delayed close for the file popover: the popover sits on the LEFT of
			// the rail (it opens leftward), so a slow mouse crossing the tiny gap
			// between rail and popover must not blink it closed. Same 140ms grace
			// the conversation-side popover uses.
			function filePopDelayClose() {
				if (filePopTimerRef.current) clearTimeout(filePopTimerRef.current);
				filePopTimerRef.current = setTimeout(function () { setFilePopOpen(false); }, 140);
			}
			function filePopCancelClose() {
				if (filePopTimerRef.current) { clearTimeout(filePopTimerRef.current); filePopTimerRef.current = null; }
			}
			var filePreviewRef = React.useRef(null); // current preview container
			// Jump to a heading in the preview: re-query the container's headings
			// at click time so stale DOM references are never used.
			function fileJumpTo(index) {
				var el = filePreviewRef.current;
				if (!el || !fileOutline) return;
				var hs = el.querySelectorAll("h1,h2,h3,h4,h5,h6");
				var want = fileOutline.headings[index];
				if (!want) return;
				for (var i = 0; i < hs.length; i++) {
					var text = (hs[i].textContent || "").replace(/\s+/g, " ").trim();
					if (text === want.text) {
						hs[i].scrollIntoView({ behavior: "smooth", block: "start" });
						break;
					}
				}
				setFilePopOpen(false);
			}

			// Detect the visible markdown preview container: a scrollable element
			// (overflow-y auto) containing h1-h6 heading elements, positioned to
			// the right of the conversation scroll body. Re-scan on a short
			// interval is avoided — use ResizeObserver + scroll + a MutationObserver
			// that only READS (locates the container), never writes to it.
			React.useEffect(function () {
				if (typeof ResizeObserver === "undefined" || typeof MutationObserver === "undefined") return;
				var mo = null;
				var ro = null;
				var ticking = false;

				function findPreview() {
					var scrollBody = document.querySelector("[data-conversation-scroll]");
					if (!scrollBody) return null;
					var bodyRect = scrollBody.getBoundingClientRect();
					var candidates = document.querySelectorAll("div");
					var best = null;
					var bestHeadings = 0;
					for (var i = 0; i < candidates.length; i++) {
						var el = candidates[i];
						if (el === scrollBody) continue;
						// Must be a scroll container with headings inside.
						var cs = getComputedStyle(el);
						if (cs.overflowY !== "auto" && cs.overflowY !== "scroll") continue;
						if (!el.querySelector("h1,h2,h3,h4,h5,h6")) continue;
						// Must be to the right of the conversation body and visible.
						var r = el.getBoundingClientRect();
						if (r.width < 120 || r.height < 120) continue;
						if (r.left < bodyRect.left + 40) continue;
						if (r.top > window.innerHeight || r.bottom < 0) continue;
						var count = el.querySelectorAll("h1,h2,h3,h4,h5,h6").length;
						if (count > bestHeadings) { bestHeadings = count; best = el; }
					}
					return best;
				}

				function update() {
					var el = findPreview();
					if (!el) {
						filePreviewRef.current = null;
						setFileOutline(null);
						setFileRailRect(null);
						return;
					}
					filePreviewRef.current = el;
					var headings = [];
					var hs = el.querySelectorAll("h1,h2,h3,h4,h5,h6");
					for (var i = 0; i < hs.length; i++) {
						var text = (hs[i].textContent || "").replace(/\s+/g, " ").trim();
						if (!text) continue;
						var level = Number(hs[i].tagName.charAt(1));
						headings.push({ level: level, text: text });
					}
					if (headings.length === 0) {
						setFileOutline(null);
						setFileRailRect(null);
						return;
					}
					setFileOutline({ headings: headings });
					var r = el.getBoundingClientRect();
					setFileRailRect({ left: r.right - 50, top: r.top + 4, height: r.height - 8 });
				}

				update();
				// Watch for the preview appearing/disappearing (file open/close)
				// and for layout shifts. Read-only observation.
				mo = new MutationObserver(function () {
					if (ticking) return;
					ticking = true;
					requestAnimationFrame(function () { ticking = false; update(); });
				});
				mo.observe(document.body, { childList: true, subtree: true });
				ro = new ResizeObserver(function () {
					if (ticking) return;
					ticking = true;
					requestAnimationFrame(function () { ticking = false; update(); });
				});
				var scrollBody = document.querySelector("[data-conversation-scroll]");
				ro.observe(scrollBody || document.body);
				return function () {
					mo.disconnect();
					ro.disconnect();
				};
			}, [snapshot]);

			// Track the assistant answer currently in the viewport and the rail's
			// position on the left edge of the conversation scroll body.
			React.useEffect(function () {
				var ticking = false;
				function update() {
					var scrollBody = document.querySelector("[data-conversation-scroll]");
					if (!scrollBody) return;
					var rect = scrollBody.getBoundingClientRect();
					setRailRect({ left: rect.left + 2, top: rect.top + 4, height: rect.height - 8 });
					// Last assistant row whose top is above the column's bottom edge
					// is the answer being read.
					// Last assistant-step row whose top is above the column's bottom
					// edge is the answer being read. Match rows by anchor key and
					// verify the node kind from the snapshot (assistant messages
					// render with kind 'assistant-step').
					var rows = scrollBody.querySelectorAll("[data-chat-anchor-key]");
					var current = null;
					for (var i = 0; i < rows.length; i++) {
						var r = rows[i].getBoundingClientRect();
						if (r.top < rect.bottom - 60) {
							var rowKey = rows[i].getAttribute("data-chat-anchor-key");
							var rowNode = rowKey && snapshot && snapshot.chat && snapshot.chat.nodes.get(rowKey);
							if (rowNode && rowNode.kind === "assistant-step") current = rows[i];
						}
					}
					if (current) {
						var key = current.getAttribute("data-chat-anchor-key");
						if (key) {
							var node = snapshot && snapshot.chat && snapshot.chat.nodes.get(key);
							if (node && node.kind === "assistant-step") {
								var headings = extractHeadings(node.data && node.data.blocks);
								if (headings.length > 0) {
									setOutline({ key: key, headings: headings });
									return;
								}
							}
						}
					}
					setOutline(null);
				}
				update();
				var scrollBody = document.querySelector("[data-conversation-scroll]");
				var target = scrollBody || window;
				function onScroll() {
					if (ticking) return;
					ticking = true;
					requestAnimationFrame(function () { ticking = false; update(); });
				}
				target.addEventListener("scroll", onScroll, { passive: true });
				window.addEventListener("resize", onScroll);
				return function () {
					target.removeEventListener("scroll", onScroll);
					window.removeEventListener("resize", onScroll);
				};
			}, [snapshot]);

			// ── header controls: 「界面调节」dropdown + 「提问历史」dropdown ──
			var rows = [];
			rows.push(
				React.createElement("button", {
					key: "uitoggle",
					type: "button",
					className: "dshct-toggle" + (uiOpen ? " dshct-toggleOpen" : ""),
					title: uiOpen ? "收起界面调节" : "展开界面调节",
					"aria-expanded": uiOpen,
					onClick: function () {
						setUiOpen(function (v) { return !v; });
						setOpen(false);
					},
				}, "界面调节"),
				React.createElement("button", {
					key: "toggle",
					type: "button",
					className: "dshct-toggle" + (open ? " dshct-toggleOpen" : ""),
					title: open ? "收起提问历史" : "展开提问历史",
					"aria-expanded": open,
					onClick: function () {
						setOpen(function (v) { return !v; });
						setUiOpen(false);
					},
				}, "提问历史"),
			);

			// ── 界面调节 dropdown: width slider + alignment toggle ──
			// The slider is a 0–100% of the current mode's max width. Storing the
			// percentage (not pixels) keeps the value stable across alignment
			// switches: 100% means "as wide as this mode legally allows".
			var uiMenu = null;
			if (uiOpen) {
				var uiPct = Math.round(widthPct);
				uiMenu = React.createElement("div", {
					className: "dshct-menu",
					style: { width: "300px" },
					role: "menu",
					"aria-label": "界面调节",
				},
					React.createElement("div", { className: "dshct-menuHead" },
						React.createElement("span", { className: "dshct-menuTitle" }, "界面调节"),
						React.createElement("button", {
							type: "button",
							className: "dshct-close",
							title: "关闭",
							onClick: function () { setUiOpen(false); },
						}, "\u00d7"),
					),
					React.createElement("div", { className: "dshct-uiRow" },
						React.createElement("span", { className: "dshct-uiLabel" }, "宽度"),
						React.createElement("input", {
							type: "range",
							className: "dshct-uiSlider",
							min: 0,
							max: 100,
							step: 1,
							value: uiPct,
							style: { "--dshct-fill": uiPct + "%" },
							title: "宽度：0% 为默认宽度，100% 占满内容区（不含左侧大纲区）",
							onChange: function (e) {
								var v = Number(e.target.value);
								e.target.style.setProperty("--dshct-fill", v + "%");
								setWidthPct(v);
							},
						}),
						React.createElement("span", { className: "dshct-uiValue" }, uiPct + "%"),
					),
					React.createElement("div", { className: "dshct-uiDivider" }),
					React.createElement("div", { className: "dshct-uiRow" },
						React.createElement("span", { className: "dshct-uiLabel" }, "位置"),
						React.createElement("div", { className: "dshct-uiSeg" },
							React.createElement("button", {
								type: "button",
								className: "dshct-uiSegBtn" + (align === "left" ? " dshct-uiSegBtnActive" : ""),
								title: "内容靠左显示（避开左侧大纲区）",
								onClick: function () { setAlign("left"); },
							}, "靠左"),
							React.createElement("button", {
								type: "button",
								className: "dshct-uiSegBtn" + (align === "center" ? " dshct-uiSegBtnActive" : ""),
								title: "内容居中显示",
								onClick: function () { setAlign("center"); },
							}, "居中"),
						),
					),
				);
			}

			var menu = null;
			if (open) {
				var items = allQuestions.map(function (q, qi) {
					var isGhost = ghostMap ? !!ghostMap[q.key] : false;
					var isLoading = ghostLoading && ghostLoading.key === q.key;
					var label = q.text;
					if (isLoading) {
						label = ghostLoading.page > 0
							? "加载更早内容…（第 " + ghostLoading.page + " 页）"
							: "正在定位…";
					} else if (isGhost) {
						label = q.text + "（未加载）";
					}
					return React.createElement("li", {
						key: q.key,
						className: "dshct-qRow" + (isGhost ? " dshct-qGhost" : ""),
					},
						React.createElement("span", { className: "dshct-qNum" }, String(qi + 1) + "."),
						React.createElement("button", {
							type: "button",
							className: "dshct-item" + (currentQ === qi ? " dshct-itemActive" : ""),
							title: isGhost ? "该提问在较早内容中，点击将自动加载并跳转" : q.text,
							disabled: isLoading,
							onClick: function () { onQuestionClick(q, qi); },
						}, label),
					);
				});

				menu = React.createElement("div", {
					className: "dshct-menu",
					style: {
						width: menuWidth + "px",
						height: menuHeight > 0 ? menuHeight + "px" : undefined,
						maxHeight: menuHeight > 0 ? menuHeight + "px" : undefined,
					},
					role: "menu",
					"aria-label": "提问历史",
				},
					React.createElement("div", {
						ref: dragRef,
						className: "dshct-resize" + (dragging ? " dshct-resizeActive" : ""),
						title: "拖拽调节宽度",
						onMouseDown: function (e) {
							e.preventDefault();
							e.stopPropagation();
							setDragging(true);
						},
					}),
					React.createElement("div", { className: "dshct-menuHead" },
						React.createElement("span", { className: "dshct-menuTitle" }, "提问历史"),
						React.createElement("button", {
							type: "button",
							className: "dshct-close",
							title: "关闭",
							onClick: function () { setOpen(false); },
						}, "\u00d7"),
					),
					React.createElement("div", { className: "dshct-navRow" },
						React.createElement("button", {
							type: "button",
							className: "dshct-navBtn",
							disabled: currentQ <= 0 || !!ghostLoading,
							title: "跳到上一个提问（Ctrl+↑）",
							onClick: function () {
								var q = currentQ > 0 ? currentQ - 1 : 0;
								if (allQuestions[q]) onQuestionClick(allQuestions[q], q, true);
							},
						}, "\u2191 上一个"),
						React.createElement("button", {
							type: "button",
							className: "dshct-navBtn",
							disabled: currentQ < 0 || currentQ >= allQuestions.length - 1 || !!ghostLoading,
							title: "跳到下一个提问（Ctrl+↓）",
							onClick: function () {
								var q = currentQ + 1;
								if (allQuestions[q]) onQuestionClick(allQuestions[q], q, true);
							},
						}, "\u2193 下一个"),
					),
					React.createElement("ul", { className: "dshct-list", role: "presentation", ref: listRef },
						items.length > 0
							? items
							: React.createElement("li", { className: "dshct-empty" }, "暂无提问"),
					),
					React.createElement("div", {
						ref: dragBRef,
						className: "dshct-resizeB" + (draggingB ? " dshct-resizeBActive" : ""),
						title: "拖拽调节高度",
						onMouseDown: function (e) {
							e.preventDefault();
							e.stopPropagation();
							setDraggingB(true);
						},
					}),
				);
			}

			// ── outline rail render ──
			// A fixed 50px-wide band on the left edge of the content area always
			// shows the current answer's heading structure as ticks. Hovering the
			// band opens the full outline panel; clicking happens in that panel.
			var rail = null;
			if (outline && railRect && outline.headings.length > 0) {
				var tickWidths = { 1: 34, 2: 27, 3: 21, 4: 16, 5: 12, 6: 9 };
				// Each tick occupies 4px height + 9px gap = 13px. (Was 14 for
				// the old 5px ticks — the 1px drift made hover highlight diverge
				// from the mouse further down the list.)
				var TICK_PITCH = 13;
				var ticks = [];
				var popItems = [];
				for (var t = 0; t < outline.headings.length; t++) {
					(function (idx) {
						var h = outline.headings[idx];
						var w = tickWidths[h.level] || 12;
						ticks.push(React.createElement("span", {
							key: "t" + idx,
							className: "dshct-tick" + (hoverIndex === idx ? " dshct-tickActive" : ""),
							style: { width: w + "px" },
						}));
						popItems.push(React.createElement("button", {
							key: "p" + idx,
							type: "button",
							className: "dshct-railPopItem" + (hoverIndex === idx ? " dshct-railPopItemActive" : ""),
							style: { paddingLeft: (8 + (h.level - 1) * 12) + "px" },
							onMouseEnter: function () { setHoverIndex(idx); popCancelClose(); },
							onClick: function () { jumpToHeading(outline.key, h.text); setPopOpen(false); },
						}, h.text));
					})(t);
				}
				function hitIndexFromEvent(e) {
					// rail has padding-top 6px; each tick occupies 4px + 9px gap.
					var y = e.clientY - railRect.top - 6;
					var idx = Math.floor(y / TICK_PITCH);
					if (idx < 0) idx = 0;
					if (idx >= outline.headings.length) idx = outline.headings.length - 1;
					return idx;
				}
				var pop = null;
				if (popOpen) {
					pop = React.createElement("div", {
						className: "dshct-railPop",
						style: { left: (railRect.left + 50 + 6) + "px", top: railRect.top + "px" },
						onMouseEnter: popCancelClose,
						onMouseLeave: popDelayClose,
						// The popover is a CHILD of the rail, so mousemove on it
						// bubbles to the rail's onMouseMove. Stop that here so the
						// rail never recomputes the hover index from the popover's
						// (different) coordinates.
						onMouseMove: function (e) { e.stopPropagation(); },
					},
						React.createElement("div", { className: "dshct-railPopTitle" }, "大纲目录"),
						popItems,
					);
				}
				rail = React.createElement("div", {
					className: "dshct-rail",
					style: { left: railRect.left + "px", top: railRect.top + "px" },
					onMouseEnter: function () { setPopOpen(true); popCancelClose(); },
					onMouseMove: function (e) { setHoverIndex(hitIndexFromEvent(e)); },
					onMouseLeave: function () { setHoverIndex(-1); popDelayClose(); },
				},
					React.createElement("div", { className: "dshct-railTicks" }, ticks),
					pop,
				);
			}

			// ── right rail render: file markdown preview outline on the right ──
			var railR = null;
			if (fileOutline && fileRailRect && fileOutline.headings.length > 0) {
				var ftickWidths = { 1: 34, 2: 27, 3: 21, 4: 16, 5: 12, 6: 9 };
				var fTICK_PITCH = 13; // 4px tick + 9px gap (was 14 — see left rail)
				var fticks = [];
				var fpopItems = [];
				for (var ft = 0; ft < fileOutline.headings.length; ft++) {
					(function (idx) {
						var h = fileOutline.headings[idx];
						var w = ftickWidths[h.level] || 12;
						fticks.push(React.createElement("span", {
							key: "ft" + idx,
							className: "dshct-tick" + (fileHover === idx ? " dshct-tickActive" : ""),
							style: { width: w + "px" },
						}));
						fpopItems.push(React.createElement("button", {
							key: "fp" + idx,
							type: "button",
							className: "dshct-railPopItem" + (fileHover === idx ? " dshct-railPopItemActive" : ""),
							style: { paddingLeft: (8 + (h.level - 1) * 12) + "px" },
							onMouseEnter: function () { setFileHover(idx); },
							onClick: function () { fileJumpTo(idx); },
						}, h.text));
					})(ft);
				}
				function fhitIndexFromEvent(e) {
					var y = e.clientY - fileRailRect.top - 6;
					var idx = Math.floor(y / fTICK_PITCH);
					if (idx < 0) idx = 0;
					if (idx >= fileOutline.headings.length) idx = fileOutline.headings.length - 1;
					return idx;
				}
				var fpop = null;
				if (filePopOpen) {
					fpop = React.createElement("div", {
						className: "dshct-railPop",
						style: { right: (window.innerWidth - fileRailRect.left + 2) + "px", top: fileRailRect.top + "px" },
						onMouseEnter: filePopCancelClose,
						onMouseLeave: filePopDelayClose,
						// Stop bubbling to the rail's onMouseMove (the popover is
						// a child of the rail): see the left rail comment.
						onMouseMove: function (e) { e.stopPropagation(); },
					},
						React.createElement("div", { className: "dshct-railPopTitle" }, "文件大纲"),
						fpopItems,
					);
				}
				railR = React.createElement("div", {
					className: "dshct-railR",
					style: { left: fileRailRect.left + "px", top: fileRailRect.top + "px" },
					onMouseEnter: function () { setFilePopOpen(true); filePopCancelClose(); },
					onMouseMove: function (e) { setFileHover(fhitIndexFromEvent(e)); },
					onMouseLeave: function () { setFileHover(-1); filePopDelayClose(); },
				},
					React.createElement("div", { className: "dshct-railRTicks" }, fticks),
					fpop,
				);
			}

			return React.createElement("div", { className: "dshct-bar", ref: barRef },
				rows,
				uiMenu,
				menu,
				rail,
				railR,
			);
		}

		/** Plugin body: register the header-utilities entry. */
		function apply(ctx) {
			ensureStyles();
			var slots = ctx.get("slots");
			if (slots === undefined) return;
			var sessions = ctx.get("sessions");
			// Resolve the current session's SessionFace (has loadOlder()) by id.
			// Plain callback over the apply-closure ctx — the inject face must
			// carry data and callbacks, not whole service objects.
			function loadOlderFor(sessionId) {
				if (!sessions || !sessionId || typeof sessions.binding !== "function") return undefined;
				try {
					var b = sessions.binding(sessionId);
					return b && b.session;
				} catch (e) { return undefined; }
			}
			slots.inject("conversation.session.header.utilities", function () {
				return slots.register(
					{
						name: "conversation.session.header.utilities",
						id: "chat-tools",
						order: 500,
						label: "聊天工具",
						inject: function () {
							return {
								// loadOlderFor(sessionId) → SessionFace | undefined
								loadOlderFor: loadOlderFor,
							};
						},
					},
					ChatTools,
				);
			});
		}

		exports.inject = ["slots"];
		exports.apply = apply;
		return module.exports;
	}
});
