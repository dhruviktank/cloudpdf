import React, { useState, useEffect } from 'react'
import {
  X,
  CloudUpload,
  Expand,
  FileX,
  RotateCcw,
} from "lucide-react";

const featureGroups = [
  {
    id: 'compress',
    title: 'Compress',
    icon: <Expand />,
    features: [
      { id: 'compress', label: 'Compress PDF' },
    ]
  },
  {
    id: 'organize',
    title: 'Organize',
    icon: '🗂️',
    features: [
      { id: 'reorder', label: 'Reorder Pages', icon: <RotateCcw /> },
      { id: 'delete-pages', label: 'Delete Pages', icon: <FileX /> }
    ]
  },
  {
    id: 'edit',
    title: 'Edit',
    icon: '✏️',
    features: [
      { id: 'rotate', label: 'Rotate Pages', icon: <RotateCcw /> }
    ]
  }
];

function FeatureGroup({ group, activeFeature, onSelectFeature }) {
  const hasSub = group.features.length > 0;

  const isGroupActive = group.features.some(
    f => f.id === activeFeature.feature
  );

  return (
    <li className={`feature-group ${isGroupActive ? "active-group" : ""}`}>
      <div className="feature-title">
        {group.title}
      </div>

      {hasSub && (
        <ul className="feature-list">
          {group.features.map(f => {
            const isActive = f.id === activeFeature.feature;

            return (
              <li
                key={f.id}
                className={`feature-item ${isActive ? "active-feature" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFeature(group.id, f.id);
                }}
              >
                <span className="f-icon">{f.icon ?? group.icon}</span>
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

  const handleSelectFeature = (groupId, featureId) => {
    onSelectFeature(groupId, featureId);
    if (isMobile) setIsOpen(false);
  };

  return (
    <>
      {isMobile && isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>

        <div className="brand">
          <div className="logo">
            <CloudUpload />
            <div className="brand-text">
              <strong>CloudPDF</strong>
            </div>
          </div>

          {isMobile && (
            <button className="sidebar-close-btn" onClick={() => setIsOpen(false)}>
              <X />
            </button>
          )}
        </div>

        <div className="scroll-area">
          <nav className="nav">
            <ul>
              {featureGroups.map(g => (
                <FeatureGroup
                  key={g.id}
                  group={g}
                  activeFeature={activeFeature}
                  onSelectFeature={handleSelectFeature}
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
