"use client";

import CodeEditor from "@/components/editor/CodeEditor";

export default function Code() {
  console.log('API key:', process.env.DEEPSEEK_API_KEY);
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full overflow-x-hidden overflow-y-hidden">
      <main className="flex-1 w-full h-screen overflow-x-hidden">
        <CodeEditor />
      </main>
    </div>
  );
}
