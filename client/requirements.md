## Packages
react-leaflet | Required for map view of local services
leaflet | Core map library
@types/leaflet | TypeScript definitions for Leaflet
framer-motion | Page animations and smooth transitions

## Notes
- Tailwind configuration: Needs "Outfit" and "DM Sans" added to the font family to match index.css
- The Map component includes an automatic icon fix for Leaflet in React
- Uses a mock location generator for profiles missing `lat`/`lng` to ensure they appear on the map for demonstration
