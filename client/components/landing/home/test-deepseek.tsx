import { useState } from "react";

export default function TestDeepseek() {
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setOutput("");

    const response = await fetch("/api/generate-contract/deepseek/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requeriments:
          "Create a basic ERC20 token in Cairo 1.0 with mint, transfer, and burn functions.",
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      console.log("Raw chunk:", chunk);

      // Match multiple data: {...} entries in the same chunk
      const matches = [...chunk.matchAll(/data: ({.*?})/g)];

      for (const match of matches) {
        try {
          const json = JSON.parse(match[1]);
          const cleaned = (json.chunk || "")
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"')
            .replace(/\\t/g, "  ")
            .replace(/\\\\/g, "\\");
          setOutput((prev) => prev + cleaned);
        } catch (e) {
          console.error("Error parsing JSON:", match[1], e);
        }
      }
    }

    setLoading(false);
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
            whiteSpace: "pre-wrap", // wrappea si se sale del ancho
            wordBreak: "break-word", // evita que se rompa el diseño
            fontSize: 14,
            fontFamily: "monospace",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {output}
        </pre>
      </div>
    </div>
  );
}