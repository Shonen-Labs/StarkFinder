import { useState } from "react";

export default function TestDeepseek() {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setOutput("");

      const res = await fetch("/api/generate-contract/deepseek/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requeriments: "Create a basic ERC20 token in Cairo 1.0 with mint, transfer, and burn functions.",
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Procesar líneas completas
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || ""; // Guarda línea incompleta para la próxima iteración

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const raw = line.slice(6).trim();

          try {
            const json = JSON.parse(raw);

            if (json.original_contract_code) {
              const formattedCode = json.original_contract_code
                .replace(/\\n/g, "\n")
                .replace(/\\t/g, "\t")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");

              const { original_contract_code, ...rest } = json;
              const meta = JSON.stringify(rest, null, 2);

              setOutput(prev =>
                prev + `\n${meta}\n\nContract Code:\n\n${formattedCode}\n`
              );
            } else if (json.chunk) {
              const chunk = json.chunk
                .replace(/\\n/g, "\n")
                .replace(/\\t/g, "\t")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\")
                .trim();

              setOutput(prev => prev + chunk);
            }
          } catch {
            setOutput(prev => prev + raw + "\n");
          }
        }
      }
    } catch (error) {
      setOutput(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>🧪 Test DeepSeek Stream</h1>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Loading..." : "Test Model"}
      </button>
      <div className="w-full overflow-hidden">
        <pre
          style={{
            marginTop: 20,
            background: "#111",
            color: "#0f0",
            padding: 16,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontSize: 14,
            fontFamily: "monospace",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <code>{output}</code>
        </pre>
      </div>
    </div>
  );
}
