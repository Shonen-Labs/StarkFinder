import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const agentsDir = path.join(__dirname, "dist");

fs.readdirSync(agentsDir)
  .filter((f) => f.endsWith(".js"))
  .forEach((file) => {
    const agentPath = path.join(agentsDir, file);
    console.log(`Starting agent: ${file}`);
    const child = spawn("node", [agentPath], { stdio: "inherit" });

    child.on("exit", (code) => {
      console.log(`Agent ${file} exited with code ${code}`);
    });
  });
