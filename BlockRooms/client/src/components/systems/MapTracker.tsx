// import React from 'react';
// import { Vector3 } from 'three';

// interface MapTrackerProps {
//   playerPosition: { x: number; y: number; z: number };
//   playerRotation?: number; // Optional rotation in radians
//   mapScale?: number; // Scale factor for the map
//   size?: number; // Size of the tracker in pixels
// }

// export const MapTracker: React.FC<MapTrackerProps> = ({
//   playerPosition,
//   playerRotation = 0,
//   mapScale = 20, // Adjust this to fit your game world scale
//   size = 200
// }) => {
//   // Convert 3D world position to 2D map coordinates (positive values only)
//   // Offset by mapScale to ensure positive coordinates, then scale to map size
//    const mapX = ((playerPosition.x + mapScale) / (mapScale * 2)) * size;
//   const mapZ = ((playerPosition.z + mapScale) / (mapScale * 2)) * size;

//   // Clamp coordinates to stay within the map bounds
//   const clampedX = Math.max(10, Math.min(size - 10, mapX));
//   const clampedZ = Math.max(10, Math.min(size - 10, mapZ));

//   // Convert rotation for the player indicator arrow
//   const rotationDegrees = (playerRotation * 180) / Math.PI;

//   const containerStyle: React.CSSProperties = {
//     position: 'fixed',
//     top: '20px',
//     right: '20px',
//     width: `${size}px`,
//     height: `${size}px`,
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     border: '2px solid #333',
//     borderRadius: '8px',
//     zIndex: 1000,
//     fontFamily: 'monospace',
//     color: '#00ff00',
//     fontSize: '12px',
//   };

//   const mapStyle: React.CSSProperties = {
//     position: 'relative',
//     width: '100%',
//     height: '100%',
//     backgroundColor: 'rgba(20, 20, 20, 0.9)',
//     border: '1px solid #444',
//     borderRadius: '4px',
//     overflow: 'hidden',
//   };

//   const gridStyle: React.CSSProperties = {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: '100%',
//     height: '100%',
//     backgroundImage: `
//       linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px),
//       linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)
//     `,
//     backgroundSize: '20px 20px',
//   };

//   const playerDotStyle: React.CSSProperties = {
//     position: 'absolute',
//     left: `${clampedX - 6}px`,
//     top: `${clampedZ - 6}px`,
//     width: '12px',
//     height: '12px',
//     backgroundColor: '#ff0000',
//     borderRadius: '50%',
//     border: '2px solid #fff',
//     zIndex: 2,
//     boxShadow: '0 0 8px rgba(255, 0, 0, 0.8)',
//   };

//   const playerArrowStyle: React.CSSProperties = {
//     position: 'absolute',
//     left: `${clampedX - 8}px`,
//     top: `${clampedZ - 8}px`,
//     width: '16px',
//     height: '16px',
//     zIndex: 3,
//     transform: `rotate(${rotationDegrees}deg)`,
//     transformOrigin: 'center',
//   };

//   const infoStyle: React.CSSProperties = {
//     position: 'absolute',
//     bottom: '4px',
//     left: '4px',
//     right: '4px',
//     backgroundColor: 'rgba(0, 0, 0, 0.8)',
//     padding: '4px',
//     borderRadius: '2px',
//     fontSize: '10px',
//     lineHeight: '1.2',
//   };

//   return (
//     <div style={containerStyle}>
//       <div style={mapStyle}>
//         {/* Grid overlay */}
//         <div style={gridStyle} />
        
//         {/* Player position indicator */}
//         <div style={playerDotStyle} />
        
//         {/* Player direction arrow */}
//         <div style={playerArrowStyle}>
//           <svg
//             width="16"
//             height="16"
//             viewBox="0 0 16 16"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               d="M8 2L12 14L8 10L4 14L8 2Z"
//               fill="#ffffff"
//               stroke="#000000"
//               strokeWidth="1"
//             />
//           </svg>
//         </div>
        
//         {/* Position info */}
//         <div style={infoStyle}>
//           <div>X: {Math.abs(playerPosition.x).toFixed(1)}</div>
//           <div>Y: {Math.abs(playerPosition.y).toFixed(1)}</div>
//           <div>Z: {Math.abs(playerPosition.z).toFixed(1)}</div>
//         </div>
//       </div>
//     </div>
//   );
// };