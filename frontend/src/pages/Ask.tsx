import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, type Repository } from '../lib/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, LoaderCircle, Sparkles, FileCode2, Network, Lightbulb, ThumbsUp, ThumbsDown, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ForceGraph2D from 'react-force-graph-2d';
import { useResizable } from '../lib/useResizable';

// A custom copy button component
function CodeCopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Copy failed", error);
      }
      textArea.remove();
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={className || "absolute top-2 right-2 bg-surface border border-border p-1.5 rounded-md text-muted hover:text-text transition-colors flex items-center gap-1 text-xs"}
    >
      {copied ? <><Check size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> Copy</>}
    </button>
  );
}

function GraphContextPanel({ source }: { source: any }) {
  const fgRef = useRef<any>();

  // If no graph context is available
  if (!source?.graph_context) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Network size={32} className="text-muted/30 mb-2" />
        <p className="text-sm font-semibold text-text mb-1">No graph context</p>
        <p className="text-xs text-muted">
          {source?.symbol_name 
            ? `Symbol '${source.symbol_name}' could not be resolved in the semantic graph for this file.`
            : `This code chunk is not bound to a distinct symbol.`}
        </p>
      </div>
    );
  }

  const impact = source.graph_context;
  const nodesMap = new Map();
  const links: any[] = [];
  
  // Add target
  if (impact.symbol) {
    nodesMap.set(impact.symbol.id, { ...impact.symbol, type: 'target' });
  }
  
  // Add callers
  impact.callers?.forEach((c: any) => {
    nodesMap.set(c.id, { ...c, type: 'caller' });
    if (impact.symbol) links.push({ source: c.id, target: impact.symbol.id });
  });
  
  // Add callees
  impact.callees?.forEach((c: any) => {
    nodesMap.set(c.id, { ...c, type: 'callee' });
    if (impact.symbol) links.push({ source: impact.symbol.id, target: c.id });
  });
  
  // Add parents/children if they exist
  impact.parents?.forEach((c: any) => {
    nodesMap.set(c.id, { ...c, type: 'parent' });
    if (impact.symbol) links.push({ source: impact.symbol.id, target: c.id, name: 'INHERITS' });
  });
  impact.children?.forEach((c: any) => {
    nodesMap.set(c.id, { ...c, type: 'child' });
    if (impact.symbol) links.push({ source: c.id, target: impact.symbol.id, name: 'INHERITS' });
  });
  
  const graphData = {
    nodes: Array.from(nodesMap.values()),
    links
  };

  useEffect(() => {
    if (graphData?.nodes?.length && fgRef.current) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(200, 20);
      }, 500);
    }
  }, [graphData]);

  if (graphData.nodes.length === 0) {
    return <div className="text-xs text-muted p-4 text-center italic">Graph is empty for this symbol.</div>;
  }

  return (
    <div className="flex-1 w-full relative min-h-[200px] bg-background border border-border rounded-md overflow-hidden">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node: any) => {
          if (node.type === 'target') return '#f59e0b';
          if (node.type === 'caller') return '#10b981';
          if (node.type === 'callee') return '#60a5fa';
          if (node.type === 'parent') return '#c084fc';
          if (node.type === 'child') return '#f472b6';
          return '#94a3b8';
        }}
        linkColor={() => 'rgba(100,110,130,0.4)'}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        nodeRelSize={4}
        width={300}
        height={250}
        cooldownTicks={50}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name as string;
          const fontSize = 10/globalScale;
          
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, 4, 0, 2 * Math.PI, false);
          
          if (node.type === 'target') ctx.fillStyle = '#f59e0b';
          else if (node.type === 'caller') ctx.fillStyle = '#10b981';
          else if (node.type === 'callee') ctx.fillStyle = '#60a5fa';
          else if (node.type === 'parent') ctx.fillStyle = '#c084fc';
          else if (node.type === 'child') ctx.fillStyle = '#f472b6';
          else ctx.fillStyle = '#94a3b8';
          
          ctx.fill();

          if (globalScale >= 1.5 || node.type === 'target') {
            ctx.font = `${fontSize}px Sans-Serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4); 

            ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
            ctx.fillRect(node.x! - bckgDimensions[0] / 2, node.y! + 6 - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#c9d1d9';
            ctx.fillText(label, node.x!, node.y! + 6);
          }
        }}
      />
    </div>
  );
}


export default function Ask() {
  const { repo } = useOutletContext<{ repo: Repository }>();
  
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [selectedSource, setSelectedSource] = useState<any | null>(null);

  const { width: rightWidth, startDragging: startRightDrag, isDragging: isRightDragging } = useResizable(400, 300, 800, 'left');

  const handleSubmit = async (overrideQ?: string) => {
    const q = overrideQ || question;
    if (!q.trim() || loading) return;

    setQuestion(q);
    setLoading(true);
    setError(null);
    setAnswer(null);
    setFeedback(null);
    setSelectedSource(null);

    try {
      const res = await api.askCodebase(repo.repository_id, q);
      setAnswer(res);
      if (res.sources && res.sources.length > 0) {
        setSelectedSource(res.sources[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process query.");
    } finally {
      setLoading(false);
    }
  };

  const handleSourceClick = (src: any) => {
    setSelectedSource(src);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-background">
      
      {/* LEFT / MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 lg:p-8 flex flex-col gap-6">
          
          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-text mb-2 flex items-center gap-2">
              <Sparkles className="text-accent" />
              Ask Codebase
            </h1>
            <p className="text-muted text-sm">
              Ask complex engineering questions about {repo.github_url.split('/').pop()}.
            </p>
          </div>

          {/* QUERY COMPOSER */}
          <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden flex-shrink-0">
            <div className="flex flex-col">
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask how something works, where it is defined, or how to use it..."
                className="w-full bg-transparent text-text p-4 outline-none resize-none min-h-[100px]"
                rows={1}
                disabled={loading}
              />
              <div className="bg-surface-hover px-4 py-3 flex items-center justify-between border-t border-border">
                <div className="flex gap-2">
                  <button className="text-xs text-muted hover:text-text bg-background border border-border px-2 py-1 rounded transition-colors flex items-center gap-1.5" onClick={() => handleSubmit("Explain the core architecture")}>
                    <Network size={12} /> Architecture
                  </button>
                  <button className="text-xs text-muted hover:text-text bg-background border border-border px-2 py-1 rounded transition-colors flex items-center gap-1.5" onClick={() => handleSubmit("How do I run the tests?")}>
                    <Lightbulb size={12} /> Tests
                  </button>
                </div>
                <button 
                  onClick={() => handleSubmit()} 
                  disabled={loading || !question.trim()}
                  className="bg-accent text-white hover:bg-accent/90 rounded-md px-4 py-2 flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Ask</span>
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-md text-sm flex items-start gap-3">
              <span className="font-bold mt-0.5">!</span>
              <div>
                <strong className="block mb-1">Error processing request</strong>
                {error}
              </div>
            </div>
          )}

          {answer && (!answer.sources || answer.sources.length === 0) && (
             <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-md text-sm">
               No relevant repository context was retrieved for this query. The model answered based solely on general knowledge and may be less accurate.
             </div>
          )}

          {/* AI ANSWER */}
          {answer && (
            <div className="bg-surface border border-border rounded-lg p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-accent" />
                  <h3 className="font-semibold text-text tracking-tight">Answer</h3>
                </div>
                <CodeCopyButton text={answer.answer} className="bg-background border border-border p-1.5 rounded-md text-muted hover:text-text transition-colors flex items-center gap-1 text-xs" />
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none text-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      
                      return !inline && match ? (
                        <div className="relative group rounded-md overflow-hidden my-4 border border-border">
                          <CodeCopyButton text={codeString} />
                          <SyntaxHighlighter
                            {...props}
                            style={vscDarkPlus as any}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{ margin: 0, padding: '1rem', background: '#0d1117' }}
                          >
                            {codeString}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code {...props} className="bg-surface-hover px-1.5 py-0.5 rounded text-accent text-[0.85em] font-mono">
                          {children}
                        </code>
                      );
                    },
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4 text-text border-b border-border pb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3 text-text" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-text" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                    li: ({node, ...props}) => <li className="" {...props} />,
                    a: ({node, ...props}) => <a className="text-accent hover:underline" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto mb-4"><table className="w-full text-left border-collapse" {...props} /></div>,
                    th: ({node, ...props}) => <th className="border-b border-border p-2 font-semibold bg-surface-hover" {...props} />,
                    td: ({node, ...props}) => <td className="border-b border-border p-2" {...props} />,
                  }}
                >
                  {answer.answer}
                </ReactMarkdown>
              </div>
              
              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border">
                <span className="text-xs text-muted">Was this helpful?</span>
                <button onClick={() => setFeedback('up')} className={`p-1.5 rounded-md hover:bg-surface-hover ${feedback === 'up' ? 'text-green-400 bg-green-400/10' : 'text-muted'}`}><ThumbsUp size={14} /></button>
                <button onClick={() => setFeedback('down')} className={`p-1.5 rounded-md hover:bg-surface-hover ${feedback === 'down' ? 'text-red-400 bg-red-400/10' : 'text-muted'}`}><ThumbsDown size={14} /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Sources, Preview, Context */}
      <aside 
        style={{ width: `${rightWidth}px` }}
        className={`bg-surface border-l border-border h-full flex flex-col flex-shrink-0 relative ${isRightDragging ? 'select-none pointer-events-none' : ''}`}
      >
        <div 
          onMouseDown={startRightDrag}
          className="absolute top-0 left-0 w-1 h-full -ml-0.5 cursor-col-resize hover:bg-accent/50 active:bg-accent z-50 pointer-events-auto transition-colors"
        />
        
        {/* Sources Panel */}
        <div className="flex flex-col h-[35%] border-b border-border">
          <div className="p-3 border-b border-border bg-surface flex items-center justify-between sticky top-0 z-10">
            <h3 className="font-semibold text-text text-sm flex items-center gap-2">
              <Network size={14} /> Sources
            </h3>
            {answer?.sources && <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">{answer.sources.length}</span>}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {!answer ? (
              <div className="text-xs text-muted italic p-4 text-center">Ask a question to see retrieved sources</div>
            ) : answer.sources.length === 0 ? (
              <div className="text-xs text-muted italic p-4 text-center">No sources found</div>
            ) : (
              answer.sources.map((src: any, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => handleSourceClick(src)}
                  className={`text-left p-2.5 rounded-md border text-sm transition-all group ${selectedSource?.id === src.id ? 'bg-accent/10 border-accent/50' : 'bg-background border-border hover:border-muted hover:bg-surface-hover'}`}
                >
                  <div className="flex items-start gap-2">
                    <FileCode2 size={14} className={`mt-0.5 flex-shrink-0 ${selectedSource?.id === src.id ? 'text-accent' : 'text-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-xs truncate ${selectedSource?.id === src.id ? 'text-text' : 'text-text group-hover:text-text'}`}>
                        {src.file_path?.split(/[\\/]/).pop() || 'Unknown'}
                      </div>
                      <div className="text-[11px] text-muted truncate mt-0.5">
                        {src.symbol_name ? `Symbol: ${src.symbol_name}` : `Line ${src.start_line || '?'}`}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Code Preview Panel */}
        <div className="flex flex-col h-[35%] border-b border-border">
          <div className="p-3 border-b border-border bg-surface flex items-center justify-between sticky top-0 z-10">
            <h3 className="font-semibold text-text text-sm">Code Preview</h3>
            {selectedSource && (
              <span className="text-[11px] text-muted max-w-[200px] truncate" title={selectedSource.file_path}>
                {selectedSource.file_path?.split(/[\\/]/).pop()}
              </span>
            )}
          </div>
          <div className="flex-1 bg-[#0d1117] overflow-auto relative">
            {selectedSource ? (
              <SyntaxHighlighter
                language={selectedSource.language?.toLowerCase() || 'python'}
                style={vscDarkPlus as any}
                customStyle={{ margin: 0, padding: '1rem', fontSize: '0.75rem', background: 'transparent' }}
                showLineNumbers={true}
                startingLineNumber={selectedSource.start_line || 1}
              >
                {selectedSource.content || selectedSource.chunk_text || '# No content available'}
              </SyntaxHighlighter>
            ) : (
              <div className="text-xs text-muted text-center flex items-center justify-center h-full italic p-4">Select a source to preview code</div>
            )}
          </div>
        </div>

        {/* Graph Context Panel */}
        <div className="flex flex-col h-[30%]">
          <div className="p-3 border-b border-border bg-surface flex items-center justify-between sticky top-0 z-10">
            <h3 className="font-semibold text-text text-sm">Graph Context</h3>
          </div>
          <div className="flex-1 overflow-auto bg-background p-2 flex flex-col items-center justify-center relative">
            {selectedSource ? (
              <GraphContextPanel source={selectedSource} />
            ) : (
              <div className="text-xs text-muted text-center flex items-center justify-center h-full italic p-4">Select a source to view graph context</div>
            )}
          </div>
        </div>

      </aside>
    </div>
  );
}
