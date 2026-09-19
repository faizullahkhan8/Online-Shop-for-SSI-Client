// Keep animation state outside React and only update composite-friendly transforms.
export function createTeamAnimation({ stage, cards, ceo }) {
    let mode = "ring";
    let paused = false;
    let reduced = false;
    let visible = false;
    let frame = null;
    let previous = null;
    let phase = 0;
    let blend = 0;
    let dirty = true;
    let disposed = false;
    let rx = 40;
    let ry = 40;
    let small = false;

    const TWO_PI = Math.PI * 2;

    // Build node list once; set will-change at init time (not per frame)
    const nodes = cards.filter(Boolean).map((node, index, all) => {
        const angle = (index / Math.max(1, all.length)) * TWO_PI;
        node.style.willChange = "transform";
        return { node, angle, radius: 0.46 + 0.54 * index / Math.max(1, all.length), layer: -1 };
    });
    if (ceo) ceo.style.willChange = "transform";

    const stop = () => {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        previous = null;
    };

    const request = () => {
        if (!disposed && visible && !document.hidden && frame === null) {
            frame = requestAnimationFrame(tick);
        }
    };

    function measure(width, height) {
        small = width < 600;
        const size = small ? 82 : 142;
        rx = Math.max(40, (width / 2 - size * 0.66 - 20) * 0.85);
        ry = Math.max(40, (height / 2 - size * 0.85 - 34) * 0.9);
        dirty = true;
        request();
    }

    function draw() {
        const blendActive = blend > 0.001;
        for (const item of nodes) {
            const angle = item.angle + phase;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            let x = cos * rx;
            let y = sin * ry;

            if (blendActive) {
                const sa = item.angle * 2 + phase;
                const tx = Math.cos(sa) * rx * item.radius;
                const ty = Math.sin(sa) * ry * item.radius;
                x += (tx - x) * blend;
                y += (ty - y) * blend;
            }

            const depth = (y / ry + 1) / 2;
            // Integer pixel positions — avoids toFixed() string allocation every frame
            const xi = (x + 0.5) | 0;
            const yi = ((y + Math.sin(phase * 2 + item.angle) * (small ? 4 : 10)) + 0.5) | 0;
            const zi = (((depth - 0.5) * (small ? 140 : 260)) + 0.5) | 0;
            const scale = (0.86 + depth * 0.14);
            // 1 decimal place for rotations is plenty smooth
            const rotY = ((cos * -200 + 0.5) | 0) / 10;
            const rotX = ((sin * 90 + 0.5) | 0) / 10;
            const rotZ = ((cos * 50 + 0.5) | 0) / 10;
            const sc   = ((scale * 1000 + 0.5) | 0) / 1000;

            item.node.style.transform =
                `translate(-50%,-50%) translate3d(${xi}px,${yi}px,${zi}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${sc})`;

            // Guard zIndex write — style recalc is expensive
            const layer = 10 + ((depth * 20 + 0.5) | 0);
            if (item.layer !== layer) {
                item.node.style.zIndex = layer;
                item.layer = layer;
            }
        }

        if (ceo) {
            const sinP  = Math.sin(phase);
            const cosP  = Math.cos(phase);
            const bobY  = ((Math.sin(phase * 1.5) * 70 + 0.5) | 0) / 10;
            const rotY  = ((sinP * 140 + 0.5) | 0) / 10;
            const rotX  = ((cosP * 60 + 0.5) | 0) / 10;
            const rotZ  = ((Math.sin(phase * 0.5) * 50 + 0.5) | 0) / 10;
            ceo.style.transform =
                `translate(-50%,-50%) translate3d(0,${bobY}px,60px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`;
        }
    }

    function tick(now) {
        frame = null;
        if (disposed || !visible || document.hidden) { previous = null; return; }

        const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.05);
        previous = now;

        const running = !paused && !reduced;
        if (running) {
            phase += dt * 0.12;
            // Wrap to [0, 2π] — prevents float precision loss after many minutes
            if (phase > TWO_PI) phase -= TWO_PI;
        }

        const target = mode === "spiral" ? 1 : 0;
        if (!running) {
            blend = target;
        } else if (Math.abs(blend - target) < 0.001) {
            blend = target;
        } else {
            blend += (target - blend) * Math.min(1, dt * 5);
        }

        if (dirty || running) draw();
        dirty = false;

        if (running) request();
        else previous = null;
    }

    const resize = new ResizeObserver(([entry]) =>
        measure(entry.contentRect.width, entry.contentRect.height)
    );
    const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) { dirty = true; request(); }
        else stop();
    }, { threshold: 0 });
    const visibility = () => { if (document.hidden) stop(); else request(); };

    measure(stage.clientWidth, stage.clientHeight);
    resize.observe(stage);
    intersection.observe(stage);
    document.addEventListener("visibilitychange", visibility);

    return {
        update(next) {
            mode    = next.mode;
            paused  = next.paused;
            reduced = next.reduced;
            dirty   = true;
            stop();
            request();
        },
        destroy() {
            disposed = true;
            stop();
            resize.disconnect();
            intersection.disconnect();
            document.removeEventListener("visibilitychange", visibility);
            // Release GPU compositing layers
            for (const item of nodes) item.node.style.willChange = "";
            if (ceo) ceo.style.willChange = "";
        },
    };
}
