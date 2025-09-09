// import React, { useState, useCallback, useEffect } from 'react';
// import { useGetNearbyDoors } from '../../dojo/hooks/fetchNearbyDoors';

// const NearbyDoorsComponent: React.FC = () => {
//   // Component state
//   const [nPressed, setNPressed] = useState<boolean>(false);
//   const [showDoorsPrompt, setShowDoorsPrompt] = useState<boolean>(false);
//   const [doorsPromptKey, setDoorsPromptKey] = useState<number>(0);
//   const { getNearbyDoors } = useGetNearbyDoors();
//   // Handle N key press
//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key.toLowerCase() === 'n') {
//         setNPressed(true);
//         getNearbyDoors();
        
//         // Reset after a short delay
//         setTimeout(() => setNPressed(false), 200);
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);

//     return () => {
//       window.removeEventListener('keydown', handleKeyDown);
//     };
//   }, []);

  

//   return (
//     <>
//       {/* Nearby Doors Component */}
//       <div style={{
//         position: 'fixed',
//         bottom: '120px',   // distance from bottom
//         left: '20px',      // distance from left (above door entry)
//         zIndex: 3000,
//         backgroundColor: nPressed ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
//         border: '2px solid #4488ff',
//         borderRadius: '8px',
//         padding: '20px',
//         color: nPressed ? 'black' : 'white',
//         fontFamily: 'monospace',
//         minWidth: '300px',
//         textAlign: 'center'
//       }}>
//         <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
//           Press N to Find Nearby Doors
//         </div>
//       </div>

//       {/* Doors fetch prompt at center top */}
//       {showDoorsPrompt && (
//         <div 
//           key={doorsPromptKey}
//           style={{
//             position: 'fixed',
//             top: '16px',
//             left: '50%',
//             transform: 'translateX(-50%)',
//             zIndex: 5000,
//             backgroundColor: 'rgba(68, 136, 255, 0.9)',
//             border: '2px solid #4488ff',
//             borderRadius: '8px',
//             padding: '15px 25px',
//             color: 'white',
//             fontFamily: 'monospace',
//             fontSize: '18px',
//             fontWeight: 'bold',
//             textAlign: 'center',
//             animation: 'fadeOut 1s ease-out forwards',
//             boxShadow: '0 4px 12px rgba(68, 136, 255, 0.4)'
//           }}
//         >
//           DOORS SEARCHED!
//         </div>
//       )}

//       {/* CSS Animation for fade out */}
//       <style>{`
//         @keyframes fadeOut {
//           0% {
//             opacity: 1;
//             transform: translateX(-50%) translateY(0px);
//           }
//           70% {
//             opacity: 1;
//             transform: translateX(-50%) translateY(-5px);
//           }
//           100% {
//             opacity: 0;
//             transform: translateX(-50%) translateY(-10px);
//           }
//         }
//       `}</style>
//     </>
//   );
// };

// export default NearbyDoorsComponent;