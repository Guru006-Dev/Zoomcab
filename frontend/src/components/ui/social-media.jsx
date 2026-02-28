import React from 'react';
import { cn } from "../../lib/utils";

const SocialTooltip = React.forwardRef(
    ({ className, items, ...props }, ref) => {
        const baseIconStyles =
            "relative flex items-center justify-center w-12 h-12 rounded-full bg-background overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-lg shadow-sm border border-gray-100";
        const baseSvgStyles =
            "relative z-10 w-5 h-5 text-gray-700 transition-colors duration-300 ease-in-out group-hover:text-white";
        const baseFilledStyles =
            "absolute bottom-0 left-0 w-full h-0 transition-all duration-300 ease-in-out group-hover:h-full";
        const baseTooltipStyles =
            "absolute bottom-[-36px] left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white whitespace-nowrap rounded-md opacity-0 invisible transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:visible group-hover:bottom-[-44px]";

        return (
            <ul
                ref={ref}
                className={cn("flex items-center gap-4 m-0 p-0 list-none", className)}
                {...props}
            >
                {items.map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                        <li key={index} className="relative group">
                            <a
                                href={item.href}
                                aria-label={item.ariaLabel}
                                className={cn(baseIconStyles)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <div
                                    className={cn(baseFilledStyles)}
                                    style={{ backgroundColor: item.color }}
                                />
                                {IconComponent && (
                                    <IconComponent className={cn(baseSvgStyles)} strokeWidth={2.2} />
                                )}
                            </a>
                            <div
                                className={cn(baseTooltipStyles)}
                                style={{ backgroundColor: item.color }}
                            >
                                {item.tooltip}
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    }
);

SocialTooltip.displayName = "SocialTooltip";

export { SocialTooltip };
