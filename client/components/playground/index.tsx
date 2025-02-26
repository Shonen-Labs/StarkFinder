import { ReactFlowProvider } from "reactflow";
import Playground from "./Playground";

// Wrap the main component with ReactFlowProvider
export default function BlocksPlayground() {
  return (
    <ReactFlowProvider>
      <Playground />
    </ReactFlowProvider>
  );
}
