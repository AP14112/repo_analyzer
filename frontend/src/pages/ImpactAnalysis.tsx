import { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Repository } from '../lib/api';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { Search, ZoomIn, ZoomOut, Maximize, Activity } from 'lucide-react';

export default function ImpactAnalysis() {
  const { repo } = useOutletContext<{ repo: Repository }>();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [impactData, setImpactData] = useState<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
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

  const loadImpact = async (id: number) => {
    setLoading(true);
    setSearchResults([]);
    setSelectedNode(null);
    try {
      const res = await api.getImpactAnalysis(id);
      setImpactData(res);

      const nodesMap = new Map();
      const links: any[] = [];
      
      const addNode = (n: any, group: string) => {
        if (!nodesMap.has(n.id)) {
          nodesMap.set(n.id, { ...n, group, val: group === 'target' ? 2 : 1 });
        }
      };

      if (res.symbol) {
        addNode(res.symbol, 'target');
        setSelectedNode(res.symbol);
      }

      res.direct_callers?.forEach((c: any) => {
        addNode(c, 'caller');
        links.push({ source: c.id, target: id, name: 'CALLS' });
      });

      res.transitive_callers?.forEach((c: any) => {
        addNode(c, 'transitive_caller');
        // Link to target for simplicity, or we could link properly if we had the path
        links.push({ source: c.id, target: id, name: 'INDIRECTLY CALLS' }); 
      });

      res.callees?.forEach((c: any) => {
        addNode(c, 'callee');
        links.push({ source: id, target: c.id, name: 'CALLS' });
      });

      res.parents?.forEach((c: any) => {
        addNode(c, 'parent');
        links.push({ source: id, target: c.id, name: 'INHERITS' });
      });

      res.children?.forEach((c: any) => {
        addNode(c, 'child');
        links.push({ source: c.id, target: id, name: 'INHERITS' });
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

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-surface border border-border p-4 rounded-lg shadow-lg w-80 max-h-[90%] overflow-y-auto">
        <h2 className="text-lg font-bold text-text mb-2">Impact Analysis</h2>
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
                onClick={() => loadImpact(res.symbol_id)}
              >
                <div className="font-semibold">{res.symbol_name}</div>
                <div className="text-xs text-muted truncate">{res.file_path}</div>
              </li>
            ))}
          </ul>
        )}
        
        {loading && <div className="text-sm text-muted mt-2">Loading...</div>}

        {!loading && impactData && (
          <div className="mt-4 text-xs space-y-2 border-t border-border pt-4">
            <h3 className="font-semibold text-sm text-text">Affected Scope</h3>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> Target: {impactData.symbol?.name}</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Direct Callers ({impactData.direct_callers?.length || 0})</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-700"></span> Transitive Callers ({impactData.transitive_callers?.length || 0})</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Callees ({impactData.callees?.length || 0})</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Parents ({impactData.parents?.length || 0})</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Children ({impactData.children?.length || 0})</div>
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
            {selectedNode.id !== impactData?.symbol?.id && (
               <button 
                 className="mt-3 text-xs bg-surface-hover border border-border px-3 py-1.5 rounded text-text hover:bg-border"
                 onClick={() => loadImpact(selectedNode.id)}
               >
                 Analyze Impact
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
            onNodeClick={n => setSelectedNode(n)}
            nodeColor={n => {
              if (selectedNode?.id === n.id) return '#f59e0b';
              if (n.group === 'target') return '#a855f7'; 
              if (n.group === 'caller') return '#22c55e'; 
              if (n.group === 'transitive_caller') return '#047857'; 
              if (n.group === 'callee') return '#3b82f6'; 
              if (n.group === 'parent') return '#eab308'; 
              if (n.group === 'child') return '#f97316'; 
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
                ctx.fillStyle = selectedNode?.id === node.id ? '#f59e0b' : (
                  node.group === 'target' ? '#a855f7' :
                  node.group === 'caller' ? '#22c55e' :
                  node.group === 'transitive_caller' ? '#047857' :
                  node.group === 'callee' ? '#3b82f6' :
                  node.group === 'parent' ? '#eab308' :
                  node.group === 'child' ? '#f97316' : '#6b7280'
                );
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
              
              if (selectedNode?.id === node.id) ctx.fillStyle = '#f59e0b';
              else if (node.group === 'target') ctx.fillStyle = '#a855f7';
              else if (node.group === 'caller') ctx.fillStyle = '#22c55e';
              else if (node.group === 'transitive_caller') ctx.fillStyle = '#047857';
              else if (node.group === 'callee') ctx.fillStyle = '#3b82f6';
              else if (node.group === 'parent') ctx.fillStyle = '#eab308';
              else if (node.group === 'child') ctx.fillStyle = '#f97316';
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
            <Activity size={48} className="mb-4 opacity-50" />
            <p>Search for a symbol to analyze its impact.</p>
            <p className="text-xs opacity-75 mt-2 max-w-md text-center">Impact analysis shows what could be affected if you change this symbol, including direct callers, transitive dependencies, and inheritance hierarchies.</p>
          </div>
        )}
      </div>
    </div>
  );
}
