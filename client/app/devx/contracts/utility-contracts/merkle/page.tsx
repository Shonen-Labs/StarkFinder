"use client";

import { MDXProvider } from "@mdx-js/react";
import type { MDXComponents } from "mdx/types";
import Merkle from "./merkle.mdx";
import { Highlight, type Language, themes } from "prism-react-renderer";

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mb-6 mt-8">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold mb-4 mt-6">{children}</h2>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
  ),
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    if (typeof children !== "string") {
      return <code>{children}</code>;
    }

    const match = /language-(\w+)/.exec(className || "");
    const language = (match ? match[1] : "cairo") as Language;

    return (
      <div className="my-6 rounded-lg overflow-hidden">
        <Highlight
          theme={themes.nightOwl}
          code={children.trim()}
          language={language}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} p-4 overflow-auto`} style={style}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="inline-block w-8 text-right mr-4 text-gray-500 select-none">
                    {i + 1}
                  </span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    );
  },
  inlineCode: ({ children }) => (
    <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm">
      {children}
    </code>
  ),
};

export default function ConcLiqAmm() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <MDXProvider components={components}>
        <Merkle />
      </MDXProvider>
    </div>
  );
}
