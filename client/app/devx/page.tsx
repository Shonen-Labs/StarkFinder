"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
//  import { AgentsTable } from "../components/agents/AgentsTable";
//  import { Header } from "../components/dashboard/Header";
//  import { Stats } from "../components/dashboard/Stats";

import BlocksPlayground from "@/components/playground/index";

export default function Home() {
  {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full overflow-x-hidden overflow-y-hidden">
      <main className="flex-1 w-full h-screen overflow-hidden">

          {/* <Header />
          <Stats />

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6">
            <AgentsTable />
          </div> */}
        <BlocksPlayground />
      </main>
    </div>
  );
  }
}

// import React, { useState } from 'react';

// const ContractGenerator = () => {
//   // State management for form inputs and results
//   const [formData, setFormData] = useState({
//     contractName: '',
//     requirements: ''
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [result, setResult] = useState({
//     success: false,
//     sourceCode: '',
//     error: ''
//   });

//   // Handle form input changes
//   const handleInputChange = (e: { target: { name: any; value: any; }; }) => {
//     const { name, value } = e.target;
//     setFormData(prevData => ({
//       ...prevData,
//       [name]: value
//     }));
//   };

//   // Handle form submission
//   const handleSubmit = async (e: { preventDefault: () => void; }) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setResult({ success: false, sourceCode: '', error: '' });

//     try {
//       const response = await fetch('/api/generate-contract', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData)
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Failed to generate contract');
//       }

//       setResult({
//         success: true,
//         sourceCode: data.sourceCode,
//         error: ''
//       });
//     } catch (error) {
//       setResult({
//         success: false,
//         sourceCode: '',
//         error: error instanceof Error ? error.message : 'An unknown error occurred'
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 px-4">
//       <div className="max-w-3xl mx-auto">
//         {/* Header Section */}
//         <div className="text-center mb-10">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             Cairo Smart Contract Generator
//           </h1>
//           <p className="text-gray-600">
//             Generate secure and efficient Cairo 2.0 smart contracts using AI
//           </p>
//         </div>

//         {/* Contract Generation Form */}
//         <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 mb-8">
//           <div className="mb-6">
//             <label
//               htmlFor="contractName"
//               className="block text-gray-700 font-medium mb-2"
//             >
//               Contract Name
//             </label>
//             <input
//               type="text"
//               id="contractName"
//               name="contractName"
//               value={formData.contractName}
//               onChange={handleInputChange}
//               className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="MyToken"
//               required
//             />
//           </div>

//           <div className="mb-6">
//             <label
//               htmlFor="requirements"
//               className="block text-gray-700 font-medium mb-2"
//             >
//               Contract Requirements
//             </label>
//             <textarea
//               id="requirements"
//               name="requirements"
//               value={formData.requirements}
//               onChange={handleInputChange}
//               className="w-full px-4 py-2 border border-gray-300 rounded-md h-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="Describe your smart contract requirements..."
//               required
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             className={`w-full py-3 px-4 rounded-md text-white font-medium
//               ${isLoading
//                 ? 'bg-blue-400 cursor-not-allowed'
//                 : 'bg-blue-600 hover:bg-blue-700'
//               }`}
//           >
//             {isLoading ? 'Generating Contract...' : 'Generate Contract'}
//           </button>
//         </form>

//         {/* Results Section */}
//         {(result.sourceCode || result.error) && (
//           <div className="bg-white shadow-md rounded-lg p-6">
//             <h2 className="text-xl font-semibold mb-4">
//               {result.success ? 'Generated Contract' : 'Error'}
//             </h2>

//             {result.error ? (
//               <div className="p-4 bg-red-50 text-red-700 rounded-md">
//                 {result.error}
//               </div>
//             ) : (
//               <div className="relative">
//                 <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto">
//                   <code className="text-sm text-gray-800">
//                     {result.sourceCode}
//                   </code>
//                 </pre>
//                 <button
//                   onClick={() => navigator.clipboard.writeText(result.sourceCode)}
//                   className="absolute top-2 right-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
//                 >
//                   Copy
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ContractGenerator;
