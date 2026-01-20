import type { LayerProps } from 'react-map-gl/maplibre';

// Cluster circles - sized and colored by count
// Filter: only features with point_count (clustered points)
export const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'businesses',
  filter: ['has', 'point_count'],
  paint: {
    // Color by count: green (0-9), yellow (10-49), orange (50+)
    'circle-color': [
      'step',
      ['get', 'point_count'],
      '#16a34a',  // Green: 0-9
      10, '#eab308',  // Yellow: 10-49
      50, '#f97316'   // Orange: 50+
    ],
    // Radius by count: 20px (small), 30px (medium), 40px (large)
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20,
      10, 30,
      50, 40
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff'
  }
};

// Cluster count labels
// Filter: only features with point_count (clustered points)
export const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'businesses',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-size': 14,
    // Use font available in MapTiler streets-v2 style
    'text-font': ['Noto Sans Bold']
  },
  paint: {
    'text-color': '#ffffff'
  }
};

// Unclustered individual points
// Filter: features without point_count (individual markers)
export const unclusteredPointLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'businesses',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': '#16a34a',  // Green to match brand
    'circle-radius': 12,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff'
  }
};
