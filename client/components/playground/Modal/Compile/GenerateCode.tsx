/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { Button } from '../../../ui/button';

interface GenerateCodeProps {
    nodes: any;
    edges: any;
    flowSummary: { content: string }[];
    setDisplayState: (state: "generate" | "contract") => void; // Use the specific type here
    setSourceCode: React.Dispatch<React.SetStateAction<string>>;
}

export default function GenerateCode({ nodes, edges, flowSummary, setDisplayState, setSourceCode }: GenerateCodeProps) {
    const [selectedOption, setSelectedOption] = useState("");
    return (
        <>
            <div className='w-17'>
                <h2 className="text-2xl mb-3 text-black font-semibold">Confirm Flow Summary?</h2>
                <div className="bg-[#d5bdaf] rounded-lg shadow-md p-4 border-2 border-[#2A2A2A]">
                    {flowSummary.map((item, index) => (
                        <div key={index} className="mb-2 flex items-center">
                            <span className="mr-2 text-red-600">{index + 1}.</span>
                            <span className="text-black">{item.content}</span>
                        </div>
                    ))}
                </div>
                

                <div className="mt-4 flex flex-col gap-1">
                    <div className=" text-lg text-black font-semibold">
                        Select Blockchain:
                    </div>
                    <select
                        id="blockchain-select"
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="p-2 bg-[#d5bdaf] text-black rounded border border-gray-600"
                        defaultValue=""
                    >
                        <option value="" disabled />
                        <option value="blockchain1">Starknet</option>
                        <option value="blockchain2">Base</option>
                        <option value="blockchain3">Polygon</option>
                        <option value="blockchain3">Supra MoveVM</option>
                    </select>
                </div>
                {!!selectedOption.length && <div className='mt-5'><Button size='lg' onClick={generateCodeHandler}>Generate</Button></div>}
            </div>
        </>
    )
    async function generateCodeHandler() {
        setDisplayState("contract")
        const fetchStreamedData = async () => {
            const response = await fetch("/api/generate-contract",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ nodes, edges, flowSummary }),
                }
            ); // Fetch data from the server
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                let done = false;

                while (!done) {
                    const { value, done: isDone } = await reader.read(); // Read chunks
                    done = isDone;

                    if (value) {
                        // Decode the chunk and append it to the state
                        setSourceCode((prev) => prev + decoder.decode(value));
                    }
                }
            }
        };

        fetchStreamedData();
    }
}
