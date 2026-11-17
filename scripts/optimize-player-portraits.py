"""Requires Pillow. Run after cache-player-portraits.mjs, from the repository root."""
import json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
directory = root / 'public/game-data/portraits'
manifest_path = root / 'src/data/portraitAssets.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
converted = {}
before = 0
after = 0
def convert(url):
    source = root / 'public' / url.lstrip('/')
    if source.parent != directory:
        raise ValueError('Portrait outside the cache: ' + str(source))
    target = source.with_suffix('.webp')
    if not source.exists() and target.exists():
        size = target.stat().st_size
        return url, '/game-data/portraits/' + target.name, size, size
    original_size = source.stat().st_size
    with Image.open(source) as image:
        image.thumbnail((320, 320), Image.Resampling.LANCZOS)
        image.convert('RGBA').save(target, 'WEBP', quality=85, method=2)
    size = target.stat().st_size
    if source != target:
        source.unlink()
    return url, '/game-data/portraits/' + target.name, original_size, size
with ThreadPoolExecutor(max_workers=16) as pool:
    for url, target, original_size, size in pool.map(convert, set(manifest.values())):
        converted[url] = target
        before += original_size
        after += size
        if len(converted) % 200 == 0:
            print('Optimized', len(converted), flush=True)
manifest_path.write_text(json.dumps({key: converted[value] for key, value in manifest.items()}, separators=(',', ':')), encoding='utf-8')
print({'portraits': len(converted), 'before_MB': round(before / 1048576, 1), 'after_MB': round(after / 1048576, 1)})
