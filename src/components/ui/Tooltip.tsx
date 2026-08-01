"use client";

import {
  useState,
  useRef,
  useEffect,
  ReactNode,
  forwardRef,
  useImperativeHandle,
} from "react";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode | string;
  position?: "top" | "bottom" | "left" | "right";
  closeOnMouseLeave?: boolean;
  showDelay?: number;
  hideDelay?: number;
  className?: string;
  variant?: "default" | "success" | "warning" | "error" | "muted";
}

export interface TooltipRef {
  show: () => void;
  hide: () => void;
  toggle: () => void;
  isVisible: boolean;
}

const Tooltip = forwardRef<TooltipRef, TooltipProps>(
  (
    {
      children,
      content,
      position = "top",
      closeOnMouseLeave = true,
      showDelay = 0,
      hideDelay = 100,
      className = "",
      variant = "default",
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const variantClasses = {
      default: "border-black text-black",
      success: "border-green-600 text-green-600",
      warning: "border-yellow-500 text-yellow-500",
      error: "border-red-600 text-red-600",
      muted: "border-gray-500 text-gray-500",
    };

    const positionClasses = {
      top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
      left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
      right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
    };

    const arrowClasses = {
      top: "top-full left-1/2 transform -translate-x-1/2",
      bottom: "bottom-full left-1/2 transform -translate-x-1/2",
      left: "left-full top-1/2 transform -translate-y-1/2",
      right: "right-full top-1/2 transform -translate-y-1/2",
    };

    const getArrowStyle = (variant: string, position: string) => {
      const colors = {
        default: "black",
        success: "#16a34a",
        warning: "#eab308",
        error: "#dc2626",
        muted: "#6b7280",
      };

      const color = colors[variant as keyof typeof colors] || colors.default;

      switch (position) {
        case "top":
          return {
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid ${color}`,
            borderBottom: "none",
          };
        case "bottom":
          return {
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: `6px solid ${color}`,
            borderTop: "none",
          };
        case "left":
          return {
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderLeft: `6px solid ${color}`,
            borderRight: "none",
          };
        case "right":
          return {
            borderTop: "6px solid transparent",
            borderBottom: "6px solid transparent",
            borderRight: `6px solid ${color}`,
            borderLeft: "none",
          };
        default:
          return {
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: `6px solid ${color}`,
            borderBottom: "none",
          };
      }
    };

    const handleMouseEnter = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }

      showTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        setIsHovered(true);
      }, showDelay);
    };

    const handleMouseLeave = () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }

      if (closeOnMouseLeave) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }

        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setIsHovered(false);
        }, hideDelay);
      }
    };

    const handleTooltipMouseEnter = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setIsHovered(true);
    };

    const handleTooltipMouseLeave = () => {
      if (closeOnMouseLeave) {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }

        hideTimeoutRef.current = setTimeout(() => {
          setIsVisible(false);
          setIsHovered(false);
        }, hideDelay);
      }
    };

    // Manual control functions for external use
    const show = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setIsVisible(true);
    };

    const hide = () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      setIsVisible(false);
      setIsHovered(false);
    };

    const toggle = () => {
      if (isVisible) {
        hide();
      } else {
        show();
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      show,
      hide,
      toggle,
      isVisible,
    }));

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (showTimeoutRef.current) {
          clearTimeout(showTimeoutRef.current);
        }
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
        }
      };
    }, []);

    return (
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}

        {isVisible && (
          <div
            ref={tooltipRef}
            className={`
            absolute z-50 px-3 py-2 text-xs font-mono
            bg-white border min-w-max max-w-xs
            ${variantClasses[variant]}
            ${positionClasses[position]}
            ${className}
          `}
            onMouseEnter={handleTooltipMouseEnter}
            onMouseLeave={handleTooltipMouseLeave}
            style={{
              filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
            }}
          >
            {/* Arrow */}
            <div
              className={`
              absolute w-0 h-0
              ${arrowClasses[position]}
            `}
              style={getArrowStyle(variant, position)}
            />

            {/* Content */}
            <div className="relative">
              {typeof content === "string" ? (
                <span className="text-xs tracking-wide">{content}</span>
              ) : (
                content
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = "Tooltip";

export default Tooltip;

// Export hook for external control
export const useTooltip = () => {
  const [isVisible, setIsVisible] = useState(false);

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible((prev) => !prev),
  };
};
