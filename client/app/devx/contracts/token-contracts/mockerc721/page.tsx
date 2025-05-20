"use client";

import { MDXProvider } from "@mdx-js/react";
import type { MDXComponents } from "mdx/types";
import MockErc721 from "./mock-erc721.mdx";
import { Highlight, type Language, themes } from "prism-react-renderer";
import Sidebar from "@/components/devx/contracts/Sidebar";
import OpenEditorButton from "@/components/OpenEditorButton";

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold mb-6 mt-8">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold mb-4 mt-6">{children}</h2>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-gray-400 leading-relaxed">{children}</p>
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
        <OpenEditorButton contractCode={children.trim()} contractName="MockERC721" />

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      <Sidebar />

      <div className="md:pl-64">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-12">
          <MDXProvider components={components}>
            <MockErc721 />
          </MDXProvider>
        </div>
      </div>
    </div>
  );
}
