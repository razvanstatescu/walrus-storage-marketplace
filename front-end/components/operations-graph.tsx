"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

// Register the dagre layout
cytoscape.use(dagre);

interface StorageOperation {
  type: string;
  description: string;
  storageObjectId?: string;
  splitSize?: string;
  splitStartEpoch?: number;
  splitEndEpoch?: number;
  splitEpoch?: number;
  reserveSize?: string;
  startEpoch?: number;
  endEpoch?: number;
  cost?: string;
}

interface ExecutionFlow {
  operationIndex: number;
  type: string;
  producesStorage: boolean;
  storageRef?: string;
  paymentIndex?: number;
  sellerAddress?: string;
  inputStorageFromOperation?: number;
  fuseTargets?: {
    first: number;
    second: number;
  };
}

interface PTBMetadata {
  paymentAmounts: string[];
  executionFlow: ExecutionFlow[];
}

interface OptimizationResult {
  operations: StorageOperation[];
  totalCost: string;
  systemOnlyPrice: string;
  ptbMetadata: PTBMetadata;
}

interface OperationsGraphProps {
  optimizationResult: OptimizationResult | null;
}

// Define colors for different operation types
const OPERATION_COLORS: Record<string, string> = {
  buy_full_storage: "#60A5FA", // blue
  buy_partial_storage_size: "#60A5FA", // blue
  buy_partial_storage_epoch: "#60A5FA", // blue
  reserve_space: "#34D399", // green
  split_by_size: "#FBBF24", // yellow
  split_by_epoch: "#F59E0B", // orange
  fuse_amount: "#A78BFA", // purple
  fuse_period: "#A78BFA", // purple
};

export default function OperationsGraph({ optimizationResult }: OperationsGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!optimizationResult || !containerRef.current || !isExpanded) return;

    const { operations, ptbMetadata } = optimizationResult;

    // Build nodes and edges from operations and execution flow
    const elements: cytoscape.ElementDefinition[] = [];

    // Create nodes for each operation
    operations.forEach((operation, index) => {
      const executionFlow = ptbMetadata.executionFlow.find(
        (flow) => flow.operationIndex === index
      );

      // Create a shorter label for the node
      let label = operation.type.replace(/_/g, " ");
      let details = "";

      // Add specific details based on operation type
      if (operation.type.includes("buy")) {
        details = "Purchase";
      } else if (operation.type.includes("split")) {
        if (operation.splitSize) {
          const sizeMB = (Number(operation.splitSize) / (1024 * 1024)).toFixed(1);
          details = `${sizeMB} MB`;
        } else if (operation.splitEpoch) {
          details = `@ epoch ${operation.splitEpoch}`;
        }
      } else if (operation.type.includes("reserve")) {
        const sizeMB = operation.reserveSize
          ? (Number(operation.reserveSize) / (1024 * 1024)).toFixed(1)
          : "?";
        details = `${sizeMB} MB`;
      } else if (operation.type.includes("fuse")) {
        details = "Merge";
      }

      elements.push({
        data: {
          id: `op-${index}`,
          label: `${index + 1}. ${label}\n${details}`,
          type: operation.type,
          description: operation.description,
          storageRef: executionFlow?.storageRef,
        },
      });
    });

    // Create edges based on execution flow
    ptbMetadata.executionFlow.forEach((flow) => {
      // Edge from input operation to current operation
      if (flow.inputStorageFromOperation !== undefined) {
        elements.push({
          data: {
            id: `edge-${flow.inputStorageFromOperation}-${flow.operationIndex}`,
            source: `op-${flow.inputStorageFromOperation}`,
            target: `op-${flow.operationIndex}`,
            label: flow.storageRef || "",
          },
        });
      }

      // Edges for fuse operations (two inputs)
      if (flow.fuseTargets) {
        elements.push({
          data: {
            id: `edge-fuse-first-${flow.operationIndex}`,
            source: `op-${flow.fuseTargets.first}`,
            target: `op-${flow.operationIndex}`,
            label: "input 1",
          },
        });
        elements.push({
          data: {
            id: `edge-fuse-second-${flow.operationIndex}`,
            source: `op-${flow.fuseTargets.second}`,
            target: `op-${flow.operationIndex}`,
            label: "input 2",
          },
        });
      }
    });

    // Add a final result node
    const lastOperation = operations.length - 1;
    elements.push({
      data: {
        id: "result",
        label: "Final Storage",
        type: "result",
      },
    });

    // Connect last operation to result
    elements.push({
      data: {
        id: `edge-${lastOperation}-result`,
        source: `op-${lastOperation}`,
        target: "result",
      },
    });

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            "background-color": (ele) => {
              const type = ele.data("type");
              return OPERATION_COLORS[type] || "#94A3B8";
            },
            label: "data(label)",
            color: "#1F2937",
            "text-valign": "center",
            "text-halign": "center",
            "font-size": isMobile ? "8px" : "10px",
            "font-weight": "bold",
            "text-wrap": "wrap",
            "text-max-width": isMobile ? "60px" : "80px",
            width: isMobile ? 80 : 100,
            height: isMobile ? 50 : 60,
            "border-width": 2,
            "border-color": "#1F2937",
            shape: "roundrectangle",
          },
        },
        {
          selector: 'node[type="result"]',
          style: {
            "background-color": "#10B981",
            "border-color": "#059669",
            "border-width": 3,
            width: isMobile ? 100 : 120,
            height: isMobile ? 45 : 50,
            "font-size": isMobile ? "10px" : "12px",
          },
        },
        {
          selector: "edge",
          style: {
            width: isMobile ? 1.5 : 2,
            "line-color": "#94A3B8",
            "target-arrow-color": "#94A3B8",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": isMobile ? 1.2 : 1.5,
            label: "data(label)",
            "font-size": isMobile ? "7px" : "8px",
            color: "#6B7280",
            "text-rotation": "autorotate",
            "text-margin-y": -10,
          },
        },
      ],
      layout: {
        name: "dagre",
        rankDir: "TB", // Top to bottom
        nodeSep: isMobile ? 20 : 30,
        rankSep: isMobile ? 50 : 70,
        padding: isMobile ? 10 : 20,
      } as any,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;

    // Fit the graph to the container
    cy.fit(undefined, 20);

    // Add tooltip on hover
    cy.on("mouseover", "node", (event) => {
      const node = event.target;
      const description = node.data("description");
      if (description) {
        node.style({
          "border-width": 4,
          "border-color": "#97f0e5",
        });
      }
    });

    cy.on("mouseout", "node", (event) => {
      const node = event.target;
      node.style({
        "border-width": 2,
        "border-color": "#1F2937",
      });
    });

    // Cleanup
    return () => {
      cy.destroy();
    };
  }, [optimizationResult, isMobile, isExpanded]);

  if (!optimizationResult) return null;

  return (
    <div className="mb-6">
      <div className="backdrop-blur-md bg-white/80 border-2 border-[#97f0e5] rounded-xl shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] overflow-hidden transition-all">
        {/* Collapsible Header */}
        <div
          className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#97f0e5]/10 transition-all"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div>
            <div className="text-xs font-bold text-gray-600 mb-1">
              OPERATIONS FLOW
            </div>
            <div className="text-sm text-gray-700 font-medium">
              {optimizationResult.operations.length} operation{optimizationResult.operations.length !== 1 ? "s" : ""} to get optimal price
            </div>
          </div>
          <div
            className={`text-2xl font-bold text-[#97f0e5] transition-transform ${
              isExpanded ? "rotate-45" : ""
            }`}
          >
            +
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t-2 border-[#97f0e5] bg-white/50 p-3 sm:p-4">
            {/* Graph Canvas */}
            <div
              ref={containerRef}
              className="w-full bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-[#97f0e5]/50"
              style={{ height: isMobile ? "300px" : "400px" }}
            />

            {/* Legend */}
            <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-[#97f0e5]/30">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded border border-gray-300"
                  style={{ backgroundColor: OPERATION_COLORS.buy_full_storage }}
                ></div>
                <span className="font-semibold text-gray-700">Purchase</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-[#97f0e5]/30">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded border border-gray-300"
                  style={{ backgroundColor: OPERATION_COLORS.reserve_space }}
                ></div>
                <span className="font-semibold text-gray-700">Reserve</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-[#97f0e5]/30">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded border border-gray-300"
                  style={{ backgroundColor: OPERATION_COLORS.split_by_size }}
                ></div>
                <span className="font-semibold text-gray-700">Split</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-[#97f0e5]/30">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded border border-gray-300"
                  style={{ backgroundColor: OPERATION_COLORS.fuse_amount }}
                ></div>
                <span className="font-semibold text-gray-700">Fuse</span>
              </div>
            </div>

            {/* Info text */}
            <div className="mt-3 text-xs text-center text-gray-600 font-medium">
              Click and drag to pan • Scroll to zoom • Hover nodes for details
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
