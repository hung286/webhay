import React, { useEffect, useRef } from 'react';

interface MathTextProps {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

declare global {
  interface Window {
    katex?: {
      renderToString: (tex: string, options?: any) => string;
      render: (tex: string, element: HTMLElement, options?: any) => void;
    };
    renderMathInElement?: (element: HTMLElement, options?: any) => void;
  }
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '', as = 'div' }) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Nếu có renderMathInElement từ auto-render
    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(containerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
        return;
      } catch (e) {
        // Fallback
      }
    }

    // Thủ công nếu có katex.renderToString
    if (window.katex && typeof window.katex.renderToString === 'function') {
      try {
        const rendered = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
          try {
            return window.katex!.renderToString(math.trim(), { displayMode: true, throwOnError: false });
          } catch {
            return math;
          }
        }).replace(/\$([^\$\n]+?)\$/g, (_, math) => {
          try {
            return window.katex!.renderToString(math.trim(), { displayMode: false, throwOnError: false });
          } catch {
            return math;
          }
        });

        containerRef.current.innerHTML = rendered.replace(/\n/g, '<br />');
      } catch (e) {
        containerRef.current.textContent = text;
      }
    }
  }, [text]);

  const Component = as as any;

  return (
    <Component
      ref={containerRef}
      className={`math-rendered ${className}`}
    >
      {text}
    </Component>
  );
};
