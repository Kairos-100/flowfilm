import { Plus, FileText, Calendar } from 'lucide-react';
import { Script } from '../../types';
import './ProjectTabs.css';

interface ScriptsTabProps {
  scripts: Script[];
}

export default function ScriptsTab({ scripts }: ScriptsTabProps) {
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Scripts</h2>
        <button className="btn-secondary">
          <Plus size={18} />
          <span>Add Script</span>
        </button>
      </div>

      {scripts.length === 0 ? (
        <div className="empty-state">
          <p>No scripts added yet.</p>
        </div>
      ) : (
        <div className="scripts-list">
          {scripts.map((script) => (
            <div key={script.id} className="script-card">
              <div className="script-icon">
                <FileText size={24} />
              </div>
              <div className="script-info">
                <h3 className="script-title">{script.title}</h3>
                <div className="script-meta">
                  <span className="script-version">Version {script.version}</span>
                  <span className="script-separator">•</span>
                  <span className="script-date">
                    <Calendar size={14} />
                    {script.lastModified.toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <button className="script-action">View</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
