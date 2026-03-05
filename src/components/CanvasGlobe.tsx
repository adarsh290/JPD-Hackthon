import { useRef, useEffect, useCallback, useState } from 'react';

interface Ping {
    id: string;
    lat: number;
    lng: number;
    type: 'visit' | 'click';
}

interface CanvasGlobeProps {
    pings: Ping[];
}

// ─── Minimal TopoJSON Decoder ───────────────────────────────────
// Decodes world-atlas TopoJSON into arrays of [lng, lat] rings
function decodeArc(topology: any, arcIdx: number): [number, number][] {
    const arc = topology.arcs[arcIdx < 0 ? ~arcIdx : arcIdx];
    const points: [number, number][] = [];
    let x = 0, y = 0;
    const t = topology.transform;
    for (const [dx, dy] of arc) {
        x += dx;
        y += dy;
        points.push([
            x * t.scale[0] + t.translate[0],
            y * t.scale[1] + t.translate[1],
        ]);
    }
    if (arcIdx < 0) points.reverse();
    return points;
}

function topoToRings(topology: any): [number, number][][] {
    const obj = topology.objects.land;
    const rings: [number, number][][] = [];

    function processArcs(arcs: any[]) {
        for (const ring of arcs) {
            const pts: [number, number][] = [];
            for (const idx of ring) {
                pts.push(...decodeArc(topology, idx));
            }
            if (pts.length > 2) rings.push(pts);
        }
    }

    if (obj.type === 'GeometryCollection') {
        for (const geom of obj.geometries) {
            if (geom.type === 'Polygon') processArcs(geom.arcs);
            else if (geom.type === 'MultiPolygon') {
                for (const polygon of geom.arcs) processArcs(polygon);
            }
        }
    } else if (obj.type === 'Polygon') {
        processArcs(obj.arcs);
    } else if (obj.type === 'MultiPolygon') {
        for (const polygon of obj.arcs) processArcs(polygon);
    }
    return rings;
}

// ─── 3D Math ────────────────────────────────────────────────────
// Full rotation: rotY (horizontal drag) then rotX (vertical drag)
function project3D(
    lat: number, lng: number,
    rotY: number, rotX: number,
    radius: number, cx: number, cy: number
) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    // Spherical to Cartesian
    let x = -radius * Math.sin(phi) * Math.cos(theta);
    let y = radius * Math.cos(phi);
    let z = radius * Math.sin(phi) * Math.sin(theta);

    // Rotate around Y-axis (horizontal drag)
    let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
    let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
    x = x1;
    z = z1;

    // Rotate around X-axis (vertical drag)
    let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
    let z2 = y * Math.sin(rotX) + z * Math.cos(rotX);
    y = y1;
    z = z2;

    const alpha = Math.max(0, z / radius);
    return { x: cx + x, y: cy - y, z, visible: z > -radius * 0.02, alpha };
}

// ─── Component ──────────────────────────────────────────────────
export function CanvasGlobe({ pings }: CanvasGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const rotOffset = useRef({ x: 0.3, y: 0 }); // slight tilt by default
    const [landRings, setLandRings] = useState<[number, number][][]>([]);

    // Fetch real world map data
    useEffect(() => {
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
            .then(r => r.json())
            .then(topo => {
                const rings = topoToRings(topo);
                setLandRings(rings);
            })
            .catch(() => {
                // Fallback: empty — globe still shows grid
            });
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        rotOffset.current.y += dx * 0.005;
        rotOffset.current.x += dy * 0.005;
        // Clamp vertical rotation to avoid flipping
        rotOffset.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotOffset.current.x));
        lastPos.current = { x: e.clientX, y: e.clientY };
    }, []);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
    }, []);

    // Touch support
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        isDragging.current = true;
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const dx = e.touches[0].clientX - lastPos.current.x;
        const dy = e.touches[0].clientY - lastPos.current.y;
        rotOffset.current.y += dx * 0.005;
        rotOffset.current.x += dy * 0.005;
        rotOffset.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotOffset.current.x));
        lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);

    const handleTouchEnd = useCallback(() => {
        isDragging.current = false;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = 0, h = 0;
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            w = canvas.offsetWidth;
            h = canvas.offsetHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const draw = (time: number) => {
            ctx.clearRect(0, 0, w, h);

            const autoRotY = time * 0.00015;
            const rotY = autoRotY + rotOffset.current.y;
            const rotX = rotOffset.current.x;
            const cx = w / 2;
            const cy = h / 2;
            const r = Math.min(w, h) * 0.4;

            const proj = (lat: number, lng: number) => project3D(lat, lng, rotY, rotX, r, cx, cy);

            // ── Atmospheric glow ──
            const atmo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.3);
            atmo.addColorStop(0, 'rgba(0, 255, 0, 0.03)');
            atmo.addColorStop(1, 'rgba(0, 255, 0, 0)');
            ctx.fillStyle = atmo;
            ctx.fillRect(0, 0, w, h);

            // ── Globe sphere ──
            const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 0, cx, cy, r);
            grad.addColorStop(0, 'rgba(0, 25, 0, 0.2)');
            grad.addColorStop(0.7, 'rgba(0, 12, 0, 0.1)');
            grad.addColorStop(1, 'rgba(0, 5, 0, 0.02)');
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // ── Grid lines ──
            ctx.lineWidth = 0.3;
            // Parallels
            for (let lat = -60; lat <= 60; lat += 30) {
                ctx.beginPath();
                let on = false;
                for (let lng = -180; lng <= 180; lng += 2) {
                    const p = proj(lat, lng);
                    if (p.visible && p.alpha > 0.01) {
                        if (!on) { ctx.moveTo(p.x, p.y); on = true; }
                        else ctx.lineTo(p.x, p.y);
                    } else on = false;
                }
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.04)';
                ctx.stroke();
            }
            // Meridians
            for (let lng = -180; lng < 180; lng += 30) {
                ctx.beginPath();
                let on = false;
                for (let lat = -90; lat <= 90; lat += 2) {
                    const p = proj(lat, lng);
                    if (p.visible && p.alpha > 0.01) {
                        if (!on) { ctx.moveTo(p.x, p.y); on = true; }
                        else ctx.lineTo(p.x, p.y);
                    } else on = false;
                }
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.04)';
                ctx.stroke();
            }

            // ── Continents (real GeoJSON data) ──
            for (const ring of landRings) {
                // Project every point
                const projected = ring.map(([lng, lat]) => proj(lat, lng));

                // Fill
                ctx.beginPath();
                let started = false;
                for (const p of projected) {
                    if (p.visible && p.alpha > 0.03) {
                        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
                        else ctx.lineTo(p.x, p.y);
                    }
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 255, 0, 0.07)';
                ctx.fill();

                // Coastline stroke with depth-fade
                for (let i = 0; i < projected.length - 1; i++) {
                    const a = projected[i];
                    const b = projected[i + 1];
                    if (!a.visible || !b.visible || a.alpha < 0.01 || b.alpha < 0.01) continue;
                    // Skip segments that wrap around the backside
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    if (dx * dx + dy * dy > r * r * 0.3) continue;

                    const avg = (a.alpha + b.alpha) / 2;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(0, 255, 0, ${(0.2 + avg * 0.5).toFixed(3)})`;
                    ctx.lineWidth = 0.6 + avg * 0.8;
                    ctx.stroke();
                }
            }

            // ── Pings ──
            for (const ping of pings) {
                const p = proj(ping.lat, ping.lng);
                if (!p.visible || p.alpha < 0.08) continue;

                const color = ping.type === 'click' ? [34, 211, 238] : [0, 255, 0];
                const pulse = 3 + Math.sin(time * 0.005 + parseFloat(ping.id) * 10) * 2;
                const size = pulse * p.alpha;

                // Glow
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 5);
                g.addColorStop(0, `rgba(${color}, ${(0.3 * p.alpha).toFixed(3)})`);
                g.addColorStop(1, `rgba(${color}, 0)`);
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 5, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();

                // Dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${color}, ${(0.9 * p.alpha).toFixed(3)})`;
                ctx.fill();
            }

            // ── Ambient particles ──
            for (let i = 0; i < 10; i++) {
                const lat = Math.sin(time * 0.0006 + i * 4.7) * 55;
                const lng = (time * 0.012 + i * 36) % 360 - 180;
                const p = proj(lat, lng);
                if (!p.visible || p.alpha < 0.1) continue;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 0, ${(0.12 + p.alpha * 0.15).toFixed(3)})`;
                ctx.fill();
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        animationRef.current = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [pings, landRings]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        />
    );
}
