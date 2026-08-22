import React from "react";
import { Link } from "react-router-dom";

/**
 * VEDED brand mark — uses the neon-lime logo asset (public/assets/veded-symbol.png).
 * Size options: "sm" | "md" | "lg". Provide `symbolOnly` to render only the V mark.
 */
export default function VededLogo({ size = "md", subtitle = true, symbolOnly = false, to = "/", dataTestId = "veded-logo" }) {
    let symbolSize = 34;
    if (size === "sm") symbolSize = 28;
    else if (size === "lg") symbolSize = 48;

    let titleSize = "text-[22px]";
    if (size === "sm") titleSize = "text-[18px]";
    else if (size === "lg") titleSize = "text-[32px]";

    const Wrapper = to ? Link : "div";
    const wrapperProps = to ? { to } : {};

    return (
        <Wrapper {...wrapperProps} className="flex items-center gap-3 select-none" data-testid={dataTestId}>
            <div className="relative shrink-0" style={{ width: symbolSize, height: symbolSize }}>
                <img
                    src="/assets/veded-symbol.png"
                    alt="VEDED"
                    width={symbolSize}
                    height={symbolSize}
                    className="w-full h-full object-contain"
                    draggable={false}
                />
            </div>
            {!symbolOnly && (
                <div className="leading-none">
                    <div className={`font-display-tight font-black tracking-[-0.06em] ${titleSize}`} style={{ color: "#c3f400", textShadow: "0 0 18px rgba(195,244,0,0.35)" }}>VEDED</div>
                    {subtitle && (
                        <div className="text-[9px] font-semibold tracking-[0.3em] text-neutral-400 mt-1">CREATIVE SUITE</div>
                    )}
                </div>
            )}
        </Wrapper>
    );
}
