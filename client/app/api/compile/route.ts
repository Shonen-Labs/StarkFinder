import { NextRequest } from "next/server";
import fs from 'fs'
import { exec } from 'child_process'
import path from 'path'

const TEMP_DIR = path.join(process.cwd(), "temp_project")

const cleanTempDir = (dir: string) => {
    try {
        fs.rmSync(dir, { recursive: true, force: true })
    } catch (error) {
        console.error("Error: ", error)
    }
}

export async function POST(req: NextRequest) {
    try {
        const { contract, scarbToml } = await req.json()

        if (typeof contract !== "string" || typeof scarbToml !== "string") {
            return new Response("Bad input", { status: 400 })
        }

        fs.mkdirSync(path.join(TEMP_DIR, "src"), { recursive: true })
        fs.writeFileSync(path.join(TEMP_DIR, 'Scarb.toml'), scarbToml)
        fs.writeFileSync(path.join(TEMP_DIR, 'src', 'main.cairo'), contract)

        return new Promise((resolve) => {
            exec(`cd ${TEMP_DIR} && scarb build`, (error, stdout, stderr) => {
                cleanTempDir(TEMP_DIR)
                const output = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`

                if (error) {
                    console.error("Compilation Error:\n", output)
                    resolve(new Response(output, { status: 500 }))
                } else {
                    resolve(new Response(stdout, { status: 200 }))
                }
            })
        })
    } catch (error) {
        return new Response(`Internal Server Error: ${String(error)}`, { status: 500 })
    }
}