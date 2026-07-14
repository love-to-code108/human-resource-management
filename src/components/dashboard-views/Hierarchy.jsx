'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges,
  addEdge,
  ReactFlowProvider,
  Panel,
  MarkerType,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { RoleNode } from '@/components/ui/RoleNode';
import { getHierarchyNodes, createHierarchyNode, updateHierarchyConnection, deleteHierarchyNode, updateNodePosition } from '@/app/actions/hierarchy';
import { getDepartments } from '@/app/actions/department';
import { getDesignations } from '@/app/actions/designation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const nodeTypes = {
  roleNode: RoleNode,
};

function HierarchyBuilder() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedDesigName, setSelectedDesigName] = useState('');
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [menu, setMenu] = useState(null); // { id, top, left, type }
  
  const { resolvedTheme } = useTheme();
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [nodesRes, deptsRes, desigsRes] = await Promise.all([
        getHierarchyNodes(),
        getDepartments(),
        getDesignations(),
      ]);

      if (deptsRes.success) setDepartments(deptsRes.departments || []);
      if (desigsRes.success) setDesignations(desigsRes.designations || []);

      if (nodesRes.success) {
        const rawNodes = nodesRes.data;
        
        // Convert to React Flow format
        // Auto-layout is tricky on the client without a library like dagre, so we'll stack them for now
        // or just spread them out slightly.
        const flowNodes = rawNodes.map((n, i) => ({
          id: n.id,
          type: 'roleNode',
          position: { 
            x: n.x ?? ((i % 3) * 250 + 50), 
            y: n.y ?? (Math.floor(i / 3) * 150 + 50) 
          },
          data: { 
            designationName: n.designation.name,
            departmentName: n.department.name,
            onDelete: () => handleDeleteNode(n.id)
          },
        }));

        const flowEdges = rawNodes
          .filter(n => n.parentId)
          .map(n => ({
            id: `e-${n.id}-${n.parentId}`,
            source: n.parentId, // Manager is the source
            target: n.id,       // Subordinate is the target
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: '#6366f1',
            },
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }));

        setNodes(flowNodes);
        setEdges(flowEdges);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onNodeDragStop = useCallback(
    async (event, node) => {
      // Save position to DB silently
      await updateNodePosition(node.id, node.position.x, node.position.y);
    },
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    async (params) => {
      // source = Manager, target = Subordinate
      const { source, target } = params;
      
      // Check if target already has a manager (parent)
      const targetAlreadyHasParent = edges.some(e => e.target === target);
      if (targetAlreadyHasParent) {
        toast.error("This role already reports to someone. Disconnect them first.");
        return;
      }

      // Optimistically add edge
      const newEdge = {
        ...params,
        id: `e-${target}-${source}`,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { stroke: '#6366f1', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      // Save to backend (Update the target's parentId to be the source)
      const res = await updateHierarchyConnection(target, source);
      if (res.error) {
        toast.error(res.error);
        // revert edge
        setEdges((eds) => eds.filter(e => e.id !== newEdge.id));
      } else {
        toast.success("Connection saved!");
      }
    },
    [edges]
  );

  const onEdgesDelete = useCallback(
    async (deletedEdges) => {
      for (const edge of deletedEdges) {
        // target is the subordinate, source is the manager.
        // Disconnecting means setting target's parentId to null
        const res = await updateHierarchyConnection(edge.target, null);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Disconnected.");
        }
      }
    },
    []
  );

  const onNodesDelete = useCallback(
    async (deletedNodes) => {
      for (const node of deletedNodes) {
        const res = await deleteHierarchyNode(node.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success("Node deleted.");
        }
      }
    },
    []
  );

  const handleAddNode = async () => {
    if (!selectedDeptName || !selectedDesigName) {
      toast.error("Please select both a Department and a Designation.");
      return;
    }

    const deptId = departments.find(d => d.name === selectedDeptName)?.id;
    const desigId = designations.find(d => d.name === selectedDesigName)?.id;

    if (!deptId || !desigId) return;

    setIsAddingNode(true);

    // Calculate smart spawn location (center of viewport)
    const { x: vpX, y: vpY, zoom } = reactFlowInstance.getViewport();
    // Assuming container width ~ 800 and height ~ 600 if we can't measure easily
    // A safe approximation for the center is:
    const spawnX = (-vpX + 400) / zoom + (Math.random() * 40 - 20);
    const spawnY = (-vpY + 300) / zoom + (Math.random() * 40 - 20);

    const res = await createHierarchyNode(deptId, desigId, spawnX, spawnY);
    
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Node added to graph!");
      const n = res.data;
      const newNode = {
        id: n.id,
        type: 'roleNode',
        position: { x: n.x ?? spawnX, y: n.y ?? spawnY },
        data: { 
          designationName: n.designation.name,
          departmentName: n.department.name,
          onDelete: () => handleDeleteNode(n.id)
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setSelectedDeptName('');
      setSelectedDesigName('');
    }
    setIsAddingNode(false);
  };

  const handleDeleteNode = async (nodeId) => {
    if (!confirm("Are you sure you want to delete this node?")) return;
    const res = await deleteHierarchyNode(nodeId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Node deleted.");
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    }
  };

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
        type: 'node'
      });
    },
    [setMenu]
  );

  const onEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault();
      setMenu({
        id: edge.id,
        top: event.clientY,
        left: event.clientX,
        type: 'edge',
        source: edge.source,
        target: edge.target
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), []);

  const handleContextDelete = () => {
    if (!menu) return;
    if (menu.type === 'node') {
      handleDeleteNode(menu.id);
    } else if (menu.type === 'edge') {
      onEdgesDelete([{ id: menu.id, source: menu.source, target: menu.target }]);
      setEdges((eds) => eds.filter(e => e.id !== menu.id));
    }
    setMenu(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      <div className="px-8 py-6 border-b bg-background z-10 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hierarchy Mapper</h2>
          <p className="text-muted-foreground text-sm">Drag and drop nodes to define reporting lines. Connect a manager (bottom) to a subordinate (top).</p>
        </div>
      </div>
      
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
          fitView
          fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          className="bg-muted/30"
        >
          <Background color="#ccc" gap={16} />
          <Controls />
          
          <Panel position="top-right" className="bg-background/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border w-80">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Add New Role Node</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Department</label>
                <Select value={selectedDeptName} onValueChange={setSelectedDeptName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Dept (e.g. UEM Jaipur)" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name} label={dept.name}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Designation</label>
                <Select value={selectedDesigName} onValueChange={setSelectedDesigName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((desig) => (
                      <SelectItem key={desig.id} value={desig.name} label={desig.name}>{desig.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddNode} disabled={isAddingNode} className="w-full">
                {isAddingNode ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Drop onto Canvas
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              <p className="mb-2"><strong>Tips:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Select a node and press <strong>Backspace</strong> to delete it.</li>
                <li>Select an edge (wire) and press <strong>Backspace</strong> to disconnect.</li>
              </ul>
            </div>
          </Panel>
        </ReactFlow>

        {menu && (
          <div 
            className="fixed z-50 min-w-32 bg-background border rounded-md shadow-md p-1"
            style={{ top: menu.top, left: menu.left }}
          >
            <button 
              className="w-full flex items-center px-2 py-1.5 text-sm text-destructive hover:bg-muted rounded-sm transition-colors"
              onClick={handleContextDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {menu.type === 'node' ? 'Delete Role' : 'Remove Connection'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Hierarchy() {
  return (
    <ReactFlowProvider>
      <HierarchyBuilder />
    </ReactFlowProvider>
  );
}
