import { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Repository } from '../lib/api';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { Search, ZoomIn, ZoomOut, Maximize, Network, RotateCcw } from 'lucide-react';

export default function Architecture() {
  const { repo } = useOutletContext<{ repo: Repository }>();
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [rawNodes, setRawNodes] = useState<any[]>([]);
  const [rawLinks, setRawLinks] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalFiles: 0, connectedFiles: 0, totalEdges: 0 });
  
  // Graph state
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  
  // Controls state
  const [query, setQuery] = useState('');
  const [showDisconnected, setShowDisconnected] = useState(false);
  
  const fgRef = useRef<ForceGraphMethods>();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [graph, edgesRes] = await Promise.all([
          api.getRepositoryGraph(repo.repository_id),
          api.getRepositoryEdges(repo.repository_id)
        ]);
        
        const nodesMap = new Map();
        const links: any[] = [];
        
        const importsMap = new Map();
        const importedByMap = new Map();

        // Add all files
        (graph.files || []).forEach((f: any) => {
          nodesMap.set(f.id, { 
            id: f.id, 
            name: (f.relative_path || f.name).split(/[\\/]/).pop(),
            fullPath: f.relative_path || f.name,
            group: 'file',
            language: f.language,
            imports: [],
            importedBy: []
          });
        });

        // Add edges and module nodes if necessary
        edgesRes.edges.forEach((edge: any) => {
          if (edge.type === 'IMPORTS') {
            if (!nodesMap.has(edge.source)) {
               nodesMap.set(edge.source, { id: edge.source, name: edge.source_name, fullPath: edge.source_name, group: 'module', imports: [], importedBy: [] });
            }
            if (!nodesMap.has(edge.target)) {
               nodesMap.set(edge.target, { id: edge.target, name: edge.target_name, fullPath: edge.target_name, group: 'module', imports: [], importedBy: [] });
            }
            links.push({ source: edge.source, target: edge.target, name: 'IMPORTS' });
            
            const sourceNode = nodesMap.get(edge.source);
            const targetNode = nodesMap.get(edge.target);
            
            if (sourceNode && targetNode) {
              if (!sourceNode.imports.includes(targetNode.name)) sourceNode.imports.push(targetNode.name);
              if (!targetNode.importedBy.includes(sourceNode.name)) targetNode.importedBy.push(sourceNode.name);
            }
          }
        });

        const allNodes = Array.from(nodesMap.values());
        
        // Count connected files
        const connectedIds = new Set();
        links.forEach(l => {
          connectedIds.add(l.source);
          connectedIds.add(l.target);
        });
        
        const connectedCount = allNodes.filter(n => n.group === 'file' && connectedIds.has(n.id)).length;
        
        setRawNodes(allNodes);
        setRawLinks(links);
        setStats({
          totalFiles: (graph.files || []).length,
          connectedFiles: connectedCount,
          totalEdges: links.length
        });
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [repo.repository_id]);

  useEffect(() => {
    if (!loading && rawNodes.length > 0) {
      let filteredNodes = rawNodes;
      
      const connectedIds = new Set();
      rawLinks.forEach(l => {
        connectedIds.add(l.source.id || l.source);
        connectedIds.add(l.target.id || l.target);
      });
      
      if (!showDisconnected && !query) {
        // Filter out disconnected files by default, unless searched
        filteredNodes = rawNodes.filter(n => n.group !== 'file' || connectedIds.has(n.id));
      }
      
      setGraphData({
        nodes: filteredNodes,
        links: rawLinks.filter(l => 
          filteredNodes.some(n => n.id === (l.source.id || l.source)) && 
          filteredNodes.some(n => n.id === (l.target.id || l.target))
        )
      });
      
      // Stop layout after a bit to prevent drift
      if (fgRef.current) {
        fgRef.current.d3Force('charge')?.strength(-150);
        fgRef.current.d3Force('link')?.distance(80);
        setTimeout(() => {
          fgRef.current?.zoomToFit(400, 50);
        }, 800);
      }
    }
  }, [rawNodes, rawLinks, showDisconnected, loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    const q = query.toLowerCase();
    
    // Exact match or contains
    let node = rawNodes.find(n => n.fullPath?.toLowerCase().includes(q) || n.name?.toLowerCase().includes(q));
    
    if (node && fgRef.current) {
      // If node was hidden because it's disconnected, show it by toggling disconnected
      const connectedIds = new Set();
      rawLinks.forEach(l => { connectedIds.add(l.source.id || l.source); connectedIds.add(l.target.id || l.target); });
      
      if (!showDisconnected && node.group === 'file' && !connectedIds.has(node.id)) {
        setShowDisconnected(true);
      }
      
      setSelectedNode(node);
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3, 1000);
    }
  };

  const handleReset = () => {
    setSelectedNode(null);
    setQuery('');
    fgRef.current?.zoomToFit(400, 50);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Search & Stats Panel */}
      <div className="absolute top-4 left-4 z-10 bg-surface border border-border p-4 rounded-lg shadow-lg w-80 max-h-[90%] overflow-y-auto flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-text mb-1">Architecture</h2>
          <p className="text-xs text-muted mb-2">
            {stats.totalFiles} files • {stats.totalEdges} import relationships
            <br/>
            Showing {stats.connectedFiles} connected files
          </p>
          
          <label className="flex items-center gap-2 text-xs text-text cursor-pointer mt-2">
            <input 
              type="checkbox" 
              checked={showDisconnected} 
              onChange={e => setShowDisconnected(e.target.checked)}
              className="rounded bg-background border-border text-accent focus:ring-accent"
            />
            Show isolated files
          </label>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search files/modules..."
            className="flex-1 bg-background border border-border px-3 py-1.5 rounded text-sm text-text focus:outline-none focus:border-accent"
          />
          <button type="submit" className="bg-accent text-white px-3 py-1.5 rounded flex items-center justify-center">
            <Search size={16} />
          </button>
        </form>

        {loading && <div className="text-sm text-muted">Loading architecture...</div>}

        {!loading && (
          <div className="text-xs text-muted">
            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-accent"></span> Repository File</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-purple-500"></span> External / Module</div>
          </div>
        )}

        {/* Selected Node Detail Panel */}
        {selectedNode && (
          <div className="pt-4 border-t border-border flex flex-col gap-3">
            <div>
              <h3 className="font-semibold text-text text-sm">{selectedNode.name}</h3>
              <p className="text-xs text-muted font-mono break-all">{selectedNode.fullPath}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-background p-2 rounded border border-border">
                <span className="text-muted block mb-0.5">Type</span>
                <span className="text-text capitalize">{selectedNode.group}</span>
              </div>
              {selectedNode.language && (
                <div className="bg-background p-2 rounded border border-border">
                  <span className="text-muted block mb-0.5">Language</span>
                  <span className="text-text">{selectedNode.language}</span>
                </div>
              )}
            </div>

            {selectedNode.imports?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text mb-1">Imports ({selectedNode.imports.length})</h4>
                <div className="max-h-32 overflow-y-auto bg-background rounded border border-border p-2 flex flex-col gap-1">
                  {selectedNode.imports.map((imp: string, i: number) => (
                    <div key={i} className="text-xs text-muted truncate" title={imp}>
                      <span className="text-accent/50 mr-1">↓</span>{imp}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.importedBy?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-text mb-1">Imported By ({selectedNode.importedBy.length})</h4>
                <div className="max-h-32 overflow-y-auto bg-background rounded border border-border p-2 flex flex-col gap-1">
                  {selectedNode.importedBy.map((imp: string, i: number) => (
                    <div key={i} className="text-xs text-muted truncate" title={imp}>
                      <span className="text-purple-400/50 mr-1">↑</span>{imp}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button className="bg-surface border border-border p-2 rounded hover:bg-surface-hover text-text shadow-sm" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)} title="Zoom In"><ZoomIn size={18} /></button>
        <button className="bg-surface border border-border p-2 rounded hover:bg-surface-hover text-text shadow-sm" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)} title="Zoom Out"><ZoomOut size={18} /></button>
        <button className="bg-surface border border-border p-2 rounded hover:bg-surface-hover text-text shadow-sm" onClick={() => fgRef.current?.zoomToFit(400, 50)} title="Fit to Screen"><Maximize size={18} /></button>
        <button className="bg-surface border border-border p-2 rounded hover:bg-surface-hover text-text shadow-sm mt-2" onClick={handleReset} title="Reset"><RotateCcw size={18} /></button>
      </div>

      {/* Graph */}
      <div className="flex-1 w-full h-full bg-background cursor-move">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel={() => ''} // We handle custom drawing
            onNodeClick={n => setSelectedNode(n)}
            nodeColor={n => {
              if (selectedNode?.id === n.id) return '#f59e0b';
              if (n.group === 'file') return '#58a6ff';
              return '#a855f7';
            }}
            linkColor={(link: any) => {
              if (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) {
                return 'rgba(255,255,255,0.6)';
              }
              return 'rgba(100,110,130,0.3)';
            }}
            linkWidth={(link: any) => (selectedNode && (link.source.id === selectedNode.id || link.target.id === selectedNode.id)) ? 2 : 1}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            nodeRelSize={4}
            cooldownTicks={100} // Stop simulation after a bit
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.name as string;
              const isSelected = selectedNode?.id === node.id;
              
              // Draw node
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, isSelected ? 6 : 4, 0, 2 * Math.PI, false);
              ctx.fillStyle = isSelected ? '#f59e0b' : (node.group === 'file' ? '#58a6ff' : '#a855f7');
              ctx.fill();

              // Draw label if selected OR zoomed in enough
              if (isSelected || globalScale >= 1.5) {
                const fontSize = isSelected ? 12/globalScale : 10/globalScale;
                ctx.font = `${isSelected ? 'bold ' : ''}${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4); 

                // Offset text below node
                const textY = node.y! + 8 + (fontSize/2);

                ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
                ctx.fillRect(node.x! - bckgDimensions[0] / 2, textY - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = isSelected ? '#f59e0b' : (node.group === 'file' ? '#c9d1d9' : '#a855f7');
                ctx.fillText(label, node.x!, textY);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted">
            <Network size={48} className="mb-4 opacity-30" />
            <p>{loading ? 'Loading architecture graph...' : 'No architecture nodes found.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
