/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Credenza, CredenzaBody, CredenzaContent } from "@/components/credeza";
import GenerateCode from "./GenerateCode";
import ContractCode from "./ContractCode";
import { useCodeStore } from "@/lib/codeStore";

type displayComponentProps = "generate" | "contract";

//QUICK-FIX
interface CompileProps {
  nodes: any;
  edges: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  flowSummary: any; // Replace 'any' with the appropriate type if known
}

export default function Compile({
  nodes,
  edges,
  isOpen,
  onOpenChange,
  flowSummary,
}: CompileProps) {
  const [displayState, setDisplayState] =
    useState<displayComponentProps>("generate");
  const sourceCode = useCodeStore((state) => state.sourceCode);
  const setSourceCode = useCodeStore((state) => state.setSourceCodeStore);

  const appendToSourceCode = (additionalCode: string) => {
    useCodeStore.setState((state) => ({
      sourceCode: state.sourceCode + additionalCode,
    }));
  };

  return (
    <>
      <Button
        onClick={() => onOpenChange(true)}
        className="bg-[#322131] hover:bg-[#21173E] text-white hoverEffect"
      >
        Generates
      </Button>

      <Credenza open={isOpen} onOpenChange={onOpenChange}>
        <CredenzaContent
          className={`border-white/10 bg-[#faf3dd] max-w-[100vh] ${
            displayState === "generate" && "w-[60vh]"
          } `}
        >
          <CredenzaBody className="max-h-[84vh] max-w-[95vh] p-5">
            {displayState === "generate" && (
              <GenerateCode
                appendToSourceCode={appendToSourceCode}
                sourceCode={sourceCode}
                nodes={nodes}
                edges={edges}
                flowSummary={flowSummary}
                setDisplayState={setDisplayState}
              />
            )}

            {displayState === "contract" && (
              <ContractCode
                setDisplayState={setDisplayState}
                sourceCode={sourceCode}
                setSourceCode={setSourceCode}
                nodes={nodes}
                edges={edges}
                flowSummary={flowSummary}
                onOpenChange={onOpenChange}
              />
            )}
          </CredenzaBody>
        </CredenzaContent>
      </Credenza>
    </>
  );
}
