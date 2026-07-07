"use client";

import React, { useId, useLayoutEffect, useRef, useState } from "react";
import { buildUnderlinePath, GOLD_ARC } from "@/lib/decorative-gold-line";
import {
    LOGO_DEPTH_SHADOW,
    LOGO_GOLD_GRADIENT,
    LOGO_METRICS,
    LOGO_PADRAO,
    LOGO_SIZES,
    LOGO_TYPOGRAPHY,
    LOGO_WRAPPER_STYLE,
    type LogoSize,
} from "@/lib/logo-recruta";

interface LogoRecrutaProps {
    size?: LogoSize;
    as?: "h1" | "h2" | "div" | "span";
    depth?: boolean;
    style?: React.CSSProperties;
    className?: string;
}

function LogoMark({ width, depth }: { width: string; depth: boolean }) {
    const gradId = useId().replace(/:/g, "");
    const gradient = `url(#logo-gold-${gradId})`;
    const recrutaRef = useRef<SVGTextElement>(null);
    const industriaRef = useRef<SVGTextElement>(null);

    const { textX, recrutaY, wordSize, lineGap, cruRCharIndex, lineStartOffset, lineStartExtra, lineEndExtra } = LOGO_METRICS;
    const lineStartX = textX - lineStartOffset - lineStartExtra;

    const [industriaX, setIndustriaX] = useState(textX + 78);
    const [lineEndX, setLineEndX] = useState(textX + 248);
    const [lineY, setLineY] = useState(recrutaY + lineGap);
    const [industriaY, setIndustriaY] = useState(recrutaY + lineGap * 2 + wordSize * 0.72);
    const [viewWidth, setViewWidth] = useState(300);
    const [viewHeight, setViewHeight] = useState(108);
    const [offsetX, setOffsetX] = useState(0);

    useLayoutEffect(() => {
        const recruta = recrutaRef.current;
        const industria = industriaRef.current;
        if (!recruta || !industria) return;

        try {
            const cruRStart = recruta.getStartPositionOfChar(cruRCharIndex);
            const cruREnd = recruta.getEndPositionOfChar(cruRCharIndex);
            const nextIndustriaX = (cruRStart.x + cruREnd.x) / 2;

            const recBox = recruta.getBBox();
            const strokeHalf = GOLD_ARC.maxHalfWidth;
            const recBottom = recBox.y + recBox.height;
            const nextLineY = recBottom + lineGap + strokeHalf;
            const indTop = nextLineY + strokeHalf + lineGap;

            industria.setAttribute("x", String(nextIndustriaX));
            const indYAttr = Number(industria.getAttribute("y") ?? industriaY);
            let indBox = industria.getBBox();
            const nextIndustriaY = indYAttr + (indTop - indBox.y);
            industria.setAttribute("y", String(nextIndustriaY));
            indBox = industria.getBBox();

            const lastIndex = Math.max(0, (industria.textContent?.length ?? 9) - 1);
            const charEndX = industria.getEndPositionOfChar(lastIndex).x;
            const bboxEndX = indBox.x + indBox.width;
            const nextLineEndX = Math.max(charEndX, bboxEndX) + GOLD_ARC.spread + lineEndExtra;

            setIndustriaX(nextIndustriaX);
            setLineY(nextLineY);
            setIndustriaY(nextIndustriaY);
            setLineEndX(nextLineEndX);

            const leftEdge = lineStartX - GOLD_ARC.tipPull;
            const rightEdge = nextLineEndX + GOLD_ARC.tipPull;
            const visualRight = depth ? rightEdge + shadow.translateX : rightEdge;
            const contentWidth = visualRight - leftEdge;
            const horizontalPad = 14;
            const nextViewWidth = Math.ceil(contentWidth + horizontalPad * 2);
            const nextOffsetX = horizontalPad - leftEdge;

            const indBottom = indBox.y + indBox.height;
            const hookBottom = nextLineY + GOLD_ARC.rise;
            const depthHeightPad = depth ? 8 : 0;
            setOffsetX(nextOffsetX);
            setViewWidth(nextViewWidth);
            setViewHeight(Math.ceil(Math.max(indBottom, hookBottom) + 2 + depthHeightPad));
        } catch {
            setIndustriaX(textX + 78);
            setLineEndX(textX + 248 + GOLD_ARC.spread + lineEndExtra);
            setOffsetX(0);
            setViewWidth(300);
            setViewHeight(108);
        }
    }, [width, cruRCharIndex, textX, lineGap, recrutaY, depth, industriaY, wordSize]);

    const textProps = {
        fontFamily: LOGO_TYPOGRAPHY.fontFamily,
        fontWeight: LOGO_TYPOGRAPHY.fontWeight,
        letterSpacing: LOGO_TYPOGRAPHY.letterSpacing,
        style: { fontKerning: LOGO_TYPOGRAPHY.fontKerning },
    };

    const underlinePath = buildUnderlinePath(lineY, lineStartX, lineEndX);

    const renderLogoLayers = (fill: string, withRefs = false) => (
        <>
            <path d={underlinePath} fill={fill} stroke="none" />
            <text
                ref={withRefs ? recrutaRef : undefined}
                x={textX}
                y={recrutaY}
                fontSize={wordSize}
                {...textProps}
                fill={fill}
            >
                RECRUTA
            </text>
            <text
                ref={withRefs ? industriaRef : undefined}
                x={industriaX}
                y={industriaY}
                fontSize={wordSize}
                {...textProps}
                fill={fill}
            >
                INDÚSTRIA
            </text>
        </>
    );

    const shadow = LOGO_DEPTH_SHADOW;

    return (
        <svg
            viewBox={`0 0 ${viewWidth} ${viewHeight}`}
            width={width}
            height="auto"
            aria-hidden
            shapeRendering="geometricPrecision"
            textRendering="geometricPrecision"
            style={{ display: "block", overflow: "visible", margin: "0 auto" }}
        >
            <defs>
                <linearGradient id={`logo-gold-${gradId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    {LOGO_GOLD_GRADIENT.map((s) => (
                        <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                    ))}
                </linearGradient>
            </defs>

            {depth && (
                <g
                    transform={`translate(${offsetX + shadow.translateX}, ${shadow.translateY})`}
                    opacity={shadow.opacity}
                >
                    {renderLogoLayers(shadow.color)}
                </g>
            )}

            <g transform={`translate(${offsetX}, 0)`}>
                {renderLogoLayers(gradient, true)}
            </g>
        </svg>
    );
}

export default function LogoRecruta({
    size = LOGO_PADRAO.defaultSize,
    as: Tag = "div",
    depth = LOGO_PADRAO.depth,
    style,
    className,
}: LogoRecrutaProps) {
    const config = LOGO_SIZES[size];

    return (
        <Tag
            className={className}
            aria-label={LOGO_PADRAO.ariaLabel}
            style={{
                ...LOGO_WRAPPER_STYLE,
                ...style,
            }}
        >
            <LogoMark width={config.width} depth={depth} />
        </Tag>
    );
}
