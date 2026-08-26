import { Activity, Server, Zap } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto p-8 flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-text tracking-tight">Settings</h1>
        <p className="text-muted mt-1 text-sm">Configure your Repository Intelligence workspace.</p>
      </div>

      <div className="card p-6 flex flex-col gap-6">
        <h2 className="text-lg font-medium text-text border-b border-border pb-2">System Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-hover border border-border p-4 rounded-lg flex items-start gap-4">
            <div className="p-2 bg-success/10 text-success rounded-md mt-0.5">
              <Server size={18} />
            </div>
            <div>
              <div className="font-medium text-text text-sm">Backend API</div>
              <div className="text-xs text-muted font-mono mt-1">{API_BASE_URL}</div>
              <div className="text-xs text-success mt-2 font-medium">Connected</div>
            </div>
          </div>

          <div className="bg-surface-hover border border-border p-4 rounded-lg flex items-start gap-4">
            <div className="p-2 bg-accent/10 text-accent rounded-md mt-0.5">
              <Zap size={18} />
            </div>
            <div>
              <div className="font-medium text-text text-sm">AI Engine</div>
              <div className="text-xs text-muted mt-1">Groq Reasoning Service</div>
              <div className="text-xs text-success mt-2 font-medium">Online</div>
            </div>
          </div>
          
          <div className="bg-surface-hover border border-border p-4 rounded-lg flex items-start gap-4">
            <div className="p-2 bg-warning/10 text-warning rounded-md mt-0.5">
              <Activity size={18} />
            </div>
            <div>
              <div className="font-medium text-text text-sm">Frontend Version</div>
              <div className="text-xs text-muted font-mono mt-1">v0.1.0</div>
              <div className="text-xs text-muted mt-2">Latest release</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
