"""Before showing the owner any picture, run:  python3 tools/test/grey_check.py picture1.png picture2.png ...

The owner does not want a grey website. This flags any picture where flat grey (low colour, mid brightness) covers
too much of it. Black and white do not count as grey. Silver with real light and depth is fine; flat grey is not.
A picture that FAILS must be redone before it is shown.
"""
import sys
from PIL import Image

LIMIT = 0.20  # share of the picture that may be grey

def grey_share(path):
    im = Image.open(path).convert('RGB')
    im.thumbnail((200, 200))
    px = im.load()
    w, h = im.size
    grey = 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            hi, lo = max(r, g, b), min(r, g, b)
            sat_low = (hi - lo) < 28
            mid = 55 < hi < 245
            if sat_low and mid:
                grey += 1
    return grey / (w * h)

bad = False
for p in sys.argv[1:]:
    g = grey_share(p)
    ok = g <= LIMIT
    bad = bad or not ok
    print('%s  grey %.0f%%  %s' % (p, g * 100, 'ok' if ok else 'FAIL: too grey, redo before showing'))
sys.exit(1 if bad else 0)
