"use client";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface OpenEditorButtonProps {
    contractCode: string;
    contractName: string;
}

const OpenEditorButton = ({ contractCode, contractName }: OpenEditorButtonProps) => {
    const router = useRouter();

    const handleOpenEditor = () => {
        // Store the code in localStorage for the editor to access
        localStorage.setItem("editorCode", contractCode);
        localStorage.setItem("contractName", contractName);

        // Navigate to the editor page
        router.push("/devx/code");
    };

    return (
        <button
            onClick={handleOpenEditor}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
            <ExternalLink size={16} />
            Open Editor
        </button>
    );
};

export default OpenEditorButton;