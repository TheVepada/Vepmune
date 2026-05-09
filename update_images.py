import json

with open('mockdata.json', 'r') as f:
    data = json.load(f)

# SVG gradient colors for each album [light, dark]
svg_colors = [
    ('8a2be2', '1a0a1a'),  # Purple for The Weeknd
    ('5a3a7a', '2a1a4a'),  # Dark purple for Tame Impala
    ('7a4a4a', '4a2a2a'),  # Brown for The 1975
    ('3a5a6a', '1a2a3a')   # Teal for Joji
]

album_names = ['My Dear Melancholy', 'Currents', 'Being Funny', 'Nectar']

# Helper function to create SVG data URI
def create_svg(text, light, dark, g_id):
    return f"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cdefs%3E%3ClinearGradient id='{g_id}' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23{light}'/%3E%3Cstop offset='100%25' style='stop-color:%23{dark}'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23{g_id})' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-size='20' fill='white' text-anchor='middle' dominant-baseline='middle' font-family='Arial'%3E{text}%3C/text%3E%3C/svg%3E"

# Update album images
for i, album in enumerate(data['albums']):
    light, dark = svg_colors[i]
    data['albums'][i]['image'] = create_svg(album_names[i], light, dark, f'g{i+1}')

# Update topRecommendations
album_map = {1: 0, 2: 1, 3: 2, 4: 3}
for i, rec in enumerate(data['topRecommendations']):
    album_idx = album_map.get(rec['albumId'], 0)
    light, dark = svg_colors[album_idx]
    data['topRecommendations'][i]['image'] = create_svg(rec['title'][:15], light, dark, f't{i+1}')

# Update newReleases
for i, rel in enumerate(data['newReleases']):
    light, dark = svg_colors[i]
    data['newReleases'][i]['image'] = create_svg(rel['album'][:20], light, dark, f'n{i+1}')

# Update trendingPlaylists
for i, pl in enumerate(data['trendingPlaylists']):
    light, dark = svg_colors[i]
    data['trendingPlaylists'][i]['image'] = create_svg(pl['name'][:18], light, dark, f'p{i+1}')

# Update currentTrack
light, dark = svg_colors[0]
data['currentTrack']['image'] = create_svg(data['currentTrack']['title'][:20], light, dark, 'c1')

with open('mockdata.json', 'w') as f:
    json.dump(data, f, indent=2)

print('✓ All images converted to SVG data URIs')
