import { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Repository } from '../lib/api';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { Search, ZoomIn, ZoomOut, Maximize, GitBranch } from 'lucide-react';

export default function CallGraph() {
  const { repo } = useOutletContext<{ repo: Repository }>();
  const [query, setQuery] = useState('');
  const [symbolId, setSymbolId] = useState<number | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  
  const fgRef = useRef<ForceGraphMethods>();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await api.searchCode(repo.repository_id, query, 5);
      setSearchResults(res.results.filter((r: any) => r.symbol_id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSymbolGraph = async (id: number) => {
    setSymbolId(id);
    setLoading(true);
    setSearchResults([]); 
    setSelectedNode(null);
    try {
      const context = await api.getSymbolContext(id);
      
      const nodesMap = new Map();
      const links: any[] = [];
      
      const addNode = (n: any, group: string) => {
        if (!nodesMap.has(n.id)) {
          nodesMap.set(n.id, { ...n, group, val: 1 });
        }
      };
      
      if (context.symbol) {
        addNode(context.symbol, 'target');
        setSelectedNode(context.symbol);
      }
      
      context.callers?.forEach((c: any) => {
        addNode(c, 'caller');
        links.push({ source: c.id, target: id, name: 'CALLS' });
      });
      
      context.callees?.forEach((c: any) => {
        addNode(c, 'callee');
        links.push({ source: id, target: c.id, name: 'CALLS' });
      });

      setGraphData({
        nodes: Array.from(nodesMap.values()),
        links
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-surface border border-border p-4 rounded-lg shadow-lg w-80 max-h-[90%] overflow-y-auto">
        <h2 className="text-lg font-bold text-text mb-2">Call Graph</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for a symbol..."
            className="flex-1 bg-background border border-border px-3 py-1.5 rounded text-sm text-text focus:outline-none focus:border-accent"
          />
          <button type="submit" className="bg-accent text-accent-foreground px-3 py-1.5 rounded flex items-center justify-center" disabled={loading}>
            <Search size={16} />
          </button>
        </form>
        
        {searchResults.length > 0 && (
          <ul className="mt-2 space-y-1 max-h-40 overflow-auto border border-border rounded bg-background">
            {searchResults.map(res => (
              <li 
                key={res.chunk_id} 
                className="text-sm p-2 hover:bg-surface-hover cursor-pointer border-b border-border text-text"
                onClick={() => loadSymbolGraph(res.symbol_id)}
              >
                <div className="font-semibold">{res.symbol_name}</div>
                <div className="text-xs text-muted truncate">{res.file_path}</div>
              </li>
            ))}
          </ul>
        )}
        
        {loading && <div className="text-sm text-muted mt-2">Loading...</div>}
        
        {!loading && symbolId && (
          <div className="mt-4 text-xs text-muted">
            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Target Symbol</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Callers</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Callees</div>
          </div>
        )}

        {selectedNode && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-text text-sm mb-2">Selected Node</h3>
            <div className="text-xs text-text space-y-1">
              <p><span className="text-muted">Name:</span> {selectedNode.name}</p>
              <p><span className="text-muted">Type:</span> {selectedNode.kind}</p>
              <p><span className="text-muted">File:</span> {selectedNode.relative_path || 'Unknown'}</p>
              <p><span className="text-muted">Lines:</span> {selectedNode.start_line} - {selectedNode.end_line}</p>
            </div>
            {selectedNode.id !== symbolId && (
               <button 
                 className="mt-3 text-xs bg-surface-hover border border-border px-3 py-1.5 rounded text-text hover:bg-border"
                 onClick={() => loadSymbolGraph(selectedNode.id)}
               >
                 Center on this Symbol
               </button>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button className="bg-surface border border-border p-2 rounded hover:bg-surface-hover text-text" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)}><ZoomIn size={18} /></button>
        <button className="bg-surface border border-border p-2 rounded hover:bg-surface-hover text-text" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)}><ZoomOut size={18} /></button>
        <button className="bg-surface border border-border p-2 rounded hover:bg-surface-hover text-text" onClick={() => fgRef.current?.zoomToFit(400)}><Maximize size={18} /></button>
      </div>

      <div className="flex-1 w-full h-full">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel="name"
            onNodeClick={handleNodeClick}
            nodeColor={n => {
              if (selectedNode?.id === n.id) return '#f59e0b';
              if (n.group === 'target') return '#a855f7'; 
              if (n.group === 'caller') return '#22c55e'; 
              if (n.group === 'callee') return '#3b82f6'; 
              return '#6b7280'; 
            }}
            linkColor={() => '#374151'}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            nodeRelSize={6}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.name as string;
              
              if (globalScale < 1.5) {
                // When zoomed out, just draw circles
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, 4, 0, 2 * Math.PI, false);
                ctx.fillStyle = selectedNode?.id === node.id ? '#f59e0b' : (node.group === 'target' ? '#a855f7' : (node.group === 'caller' ? '#22c55e' : '#3b82f6'));
                ctx.fill();
                return;
              }

              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); 

              ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
              ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              if (selectedNode?.id === node.id) ctx.fillStyle = '#f59e0b'; // highlight selected
              else if (node.group === 'target') ctx.fillStyle = '#a855f7';
              else if (node.group === 'caller') ctx.fillStyle = '#22c55e';
              else if (node.group === 'callee') ctx.fillStyle = '#3b82f6';
              else ctx.fillStyle = '#6b7280';
              
              ctx.fillText(label, node.x!, node.y!);
              
              node.__bckgDimensions = bckgDimensions; 
            }}
            nodePointerAreaPaint={(node, color, ctx) => {
              if (node.__bckgDimensions) {
                ctx.fillStyle = color;
                const bckgDimensions = node.__bckgDimensions;
                bckgDimensions && ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
              } else {
                ctx.beginPath();
                ctx.arc(node.x!, node.y!, 4, 0, 2 * Math.PI, false);
                ctx.fillStyle = color;
                ctx.fill();
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted">
            <GitBranch size={48} className="mb-4 opacity-50" />
            <p>Search and select a symbol to view its call graph.</p>
          </div>
        )}
      </div>
    </div>
  );
}
