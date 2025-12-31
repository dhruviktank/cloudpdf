import React, { useState, useEffect } from 'react';
import { CloudUpload, X } from 'lucide-react';
import { Icons } from '../data/icons';
import { featureGroups } from '../data/featureGroups';

function FeatureGroup({ group, activeFeature, onSelectFeature }) {
  const hasSub = group.features.length > 0;
  const isGroupActive = group.features.some(f => f.id === activeFeature.feature);

  return (
    <li className={`feature-group ${isGroupActive ? "active-group" : ""}`}>
      <div className="feature-title">{group.title}</div>
      {hasSub && (
        <ul className="feature-list">
          {group.features.map(f => {
            const isActive = f.id === activeFeature.feature;
            const FeatureIcon = Icons[f.icon];
            return (
              <li
                key={f.id}
                className={`feature-item ${isActive ? "active-feature" : ""}`}
                onClick={(e) => { e.stopPropagation(); onSelectFeature(f); }}
              >
                <span className="f-icon"><FeatureIcon /></span>
                {f.label}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export default function Sidebar({ onSelectFeature, isOpen, setIsOpen, activeFeature }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpen]);

  return (
    <>
      {isMobile && isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="brand">
          <div className="logo">
            <CloudUpload />
            <div className="brand-text"><strong>CloudPDF</strong></div>
          </div>
          {isMobile && (
            <button className="sidebar-close-btn" onClick={() => setIsOpen(false)}><X /></button>
          )}
        </div>

        <div className="scroll-area">
          {/* Feature Navigation */}
          <nav className="nav">
            <ul>
              {featureGroups.map(g => (
                <FeatureGroup
                  key={g.id}
                  group={g}
                  activeFeature={activeFeature}
                  onSelectFeature={onSelectFeature}
                />
              ))}
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="link-btn">Settings</button>
        </div>
      </aside>
    </>
  );
}
