/** Parâmetros das pontas douradas — mesmo estilo do logotipo */
export const GOLD_ARC = {
    rise: 21,
    spread: 17,
    tipPull: 10,
    maxHalfWidth: 1.15,
    taperLen: 22,
} as const;

export const GOLD_GRADIENT_STOPS = [
    { offset: "0%", color: "#8D6B1F" },
    { offset: "35%", color: "#D4AF37" },
    { offset: "65%", color: "#F0D878" },
    { offset: "100%", color: "#C89B3C" },
] as const;

type Pt = { x: number; y: number };

function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
    const m = 1 - t;
    const m2 = m * m;
    const t2 = t * t;
    return {
        x: m2 * m * p0.x + 3 * m2 * t * p1.x + 3 * m * t2 * p2.x + t2 * t * p3.x,
        y: m2 * m * p0.y + 3 * m2 * t * p1.y + 3 * m * t2 * p2.y + t2 * t * p3.y,
    };
}

function cubicTangent(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
    const m = 1 - t;
    return {
        x:
            3 * m * m * (p1.x - p0.x) +
            6 * m * t * (p2.x - p1.x) +
            3 * t * t * (p3.x - p2.x),
        y:
            3 * m * m * (p1.y - p0.y) +
            6 * m * t * (p2.y - p1.y) +
            3 * t * t * (p3.y - p2.y),
    };
}

function sampleSegment(
    p0: Pt,
    p1: Pt,
    p2: Pt,
    p3: Pt,
    steps: number,
    out: Pt[],
    skipFirst = false,
) {
    for (let i = skipFirst ? 1 : 0; i <= steps; i++) {
        out.push(cubicAt(p0, p1, p2, p3, i / steps));
    }
}

function buildTaperedStroke(center: Pt[], hookSteps: number, tipL: Pt, leftC1: Pt, leftC2: Pt, joinL: Pt, joinR: Pt, rightC1: Pt, rightC2: Pt, tipR: Pt): string {
    const { maxHalfWidth, taperLen } = GOLD_ARC;
    const total = center.length;
    const upper: Pt[] = [];
    const lower: Pt[] = [];

    for (let i = 0; i < total; i++) {
        const p = center[i];
        const distFromStart = i;
        const distFromEnd = total - 1 - i;
        const taper = Math.min(1, distFromStart / taperLen, distFromEnd / taperLen);
        const half = maxHalfWidth * taper * taper;

        let tangent: Pt;
        if (i < hookSteps) {
            tangent = cubicTangent(tipL, leftC1, leftC2, joinL, i / hookSteps);
        } else if (i > total - 1 - hookSteps) {
            const ri = i - (total - 1 - hookSteps);
            tangent = cubicTangent(joinR, rightC1, rightC2, tipR, ri / hookSteps);
        } else {
            tangent = { x: 1, y: 0 };
        }

        const len = Math.hypot(tangent.x, tangent.y) || 1;
        const nx = -tangent.y / len;
        const ny = tangent.x / len;

        upper.push({ x: p.x + nx * half, y: p.y + ny * half });
        lower.push({ x: p.x - nx * half, y: p.y - ny * half });
    }

    const fmt = (pt: Pt) => `${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    const upperPath = upper.map((pt, i) => `${i === 0 ? "M" : "L"} ${fmt(pt)}`).join(" ");
    const lowerPath = [...lower].reverse().map((pt) => `L ${fmt(pt)}`).join(" ");

    return `${upperPath} ${lowerPath} Z`;
}

function buildHorizontalCenterline(lineY: number, startX: number, endX: number, variant: "top" | "bottom"): {
    tipL: Pt;
    leftC1: Pt;
    leftC2: Pt;
    joinL: Pt;
    joinR: Pt;
    rightC1: Pt;
    rightC2: Pt;
    tipR: Pt;
    center: Pt[];
} {
    const { rise, spread, tipPull } = GOLD_ARC;
    const k = 0.5522847498;

    const tipL: Pt =
        variant === "top"
            ? { x: startX - tipPull, y: lineY - rise }
            : { x: startX - tipPull, y: lineY + rise };
    const joinL: Pt = { x: startX + spread, y: lineY };
    const joinR: Pt = { x: endX - spread, y: lineY };
    const tipR: Pt =
        variant === "top"
            ? { x: endX + tipPull, y: lineY + rise }
            : { x: endX + tipPull, y: lineY - rise };

    const leftC1: Pt =
        variant === "top"
            ? { x: tipL.x, y: tipL.y + rise * k }
            : { x: tipL.x, y: tipL.y - rise * k };
    const leftC2: Pt = { x: joinL.x - spread * k, y: joinL.y };
    const rightC1: Pt = { x: joinR.x + spread * k, y: joinR.y };
    const rightC2: Pt =
        variant === "top"
            ? { x: tipR.x, y: tipR.y - rise * k }
            : { x: tipR.x, y: tipR.y + rise * k };

    const center: Pt[] = [];
    sampleSegment(tipL, leftC1, leftC2, joinL, 20, center);

    const hSteps = Math.max(10, Math.round((joinR.x - joinL.x) / 10));
    for (let i = 1; i <= hSteps; i++) {
        const t = i / hSteps;
        center.push({
            x: joinL.x + (joinR.x - joinL.x) * t,
            y: lineY,
        });
    }

    sampleSegment(joinR, rightC1, rightC2, tipR, 20, center, true);

    return { tipL, leftC1, leftC2, joinL, joinR, rightC1, rightC2, tipR, center };
}

/** Linha superior — ponta esquerda sobe, direita desce (como no logo) */
export function buildUnderlinePath(lineY: number, startX: number, endX: number): string {
    const seg = buildHorizontalCenterline(lineY, startX, endX, "top");
    return buildTaperedStroke(
        seg.center,
        20,
        seg.tipL,
        seg.leftC1,
        seg.leftC2,
        seg.joinL,
        seg.joinR,
        seg.rightC1,
        seg.rightC2,
        seg.tipR,
    );
}

/** Linha inferior — espelho vertical da superior */
export function buildUnderlinePathInverted(lineY: number, startX: number, endX: number): string {
    const seg = buildHorizontalCenterline(lineY, startX, endX, "bottom");
    return buildTaperedStroke(
        seg.center,
        20,
        seg.tipL,
        seg.leftC1,
        seg.leftC2,
        seg.joinL,
        seg.joinR,
        seg.rightC1,
        seg.rightC2,
        seg.tipR,
    );
}

/** Conector lateral curvo entre as linhas horizontais */
export function buildSideConnector(
    side: "left" | "right",
    topY: number,
    bottomY: number,
    joinX: number,
): string {
    const { maxHalfWidth } = GOLD_ARC;
    const bulge = side === "left" ? -11 : 11;
    const midY = (topY + bottomY) / 2;
    const half = maxHalfWidth * 0.82;

    const p0 = { x: joinX, y: topY };
    const p3 = { x: joinX, y: bottomY };
    const p1 = { x: joinX + bulge * 0.55, y: topY + (midY - topY) * 0.45 };
    const p2 = { x: joinX + bulge * 0.55, y: bottomY - (bottomY - midY) * 0.45 };

    const center: Pt[] = [];
    for (let i = 0; i <= 16; i++) {
        center.push(cubicAt(p0, p1, p2, p3, i / 16));
    }

    const upper: Pt[] = [];
    const lower: Pt[] = [];
    for (let i = 0; i < center.length; i++) {
        const t = i / (center.length - 1);
        const taper = Math.min(1, t / 0.22, (1 - t) / 0.22);
        const w = half * taper * taper;
        const tangent = cubicTangent(p0, p1, p2, p3, t);
        const len = Math.hypot(tangent.x, tangent.y) || 1;
        const nx = -tangent.y / len;
        const ny = tangent.x / len;
        upper.push({ x: center[i].x + nx * w, y: center[i].y + ny * w });
        lower.push({ x: center[i].x - nx * w, y: center[i].y - ny * w });
    }

    const fmt = (pt: Pt) => `${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    const upperPath = upper.map((pt, i) => `${i === 0 ? "M" : "L"} ${fmt(pt)}`).join(" ");
    const lowerPath = [...lower].reverse().map((pt) => `L ${fmt(pt)}`).join(" ");
    return `${upperPath} ${lowerPath} Z`;
}

export function getHorizontalJoinXs(startX: number, endX: number) {
    return {
        left: startX + GOLD_ARC.spread,
        right: endX - GOLD_ARC.spread,
    };
}
