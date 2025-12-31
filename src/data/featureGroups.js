export const featureGroups = [
  {
    id: 'compress',
    title: 'Compress',
    features: [
      { id: 'compress', label: 'Compress PDF', icon: 'Expand', file: 'application/pdf' }
    ]
  },
  {
    id: 'convert',
    title: 'Convert',
    features: [
      { id: 'image-pdf', label: 'Image to PDF', icon: 'ArrowLeftRight', file: 'image/*' }
    ]
  },
  {
    id: 'organize',
    title: 'Organize',
    features: [
      { id: 'reorder', label: 'Reorder Pages', icon: 'RotateCcw', file: 'application/pdf' },
      { id: 'delete-pages', label: 'Delete Pages', icon: 'FileX', file: 'application/pdf' }
    ]
  },
  {
    id: 'edit',
    title: 'Edit',
    features: [
      { id: 'rotate', label: 'Rotate Pages', icon: 'RotateCcw', file: 'application/pdf' }
    ]
  }
];
