import sys, numpy as np
from PIL import Image, ImageFilter
def ends_similarity(path):
    im = Image.open(path).convert('L')
    a = np.array(im).astype(float)
    a[:5] = 0
    a[655:] = 0
    m = (a > 70)
    ys, xs = np.nonzero(m)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    sub = m[y0:y1+1, x0:x1+1]
    img = Image.fromarray((sub * 255).astype('uint8')).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(3))
    s = np.array(img) > 40
    rot = s[::-1, ::-1]
    w = s.shape[1]; k = int(w * 0.30)
    left = s[:, :k]; right_rot = rot[:, :k]      # the right end, turned 180 degrees, laid on the left end
    inter = (left & right_rot).sum(); union = (left | right_rot).sum()
    return round(100 * inter / union, 1), (x1 - x0, y1 - y0)
for p in sys.argv[1:]:
    print(p.split('/')[-1], 'left end vs right end turned 180deg: overlap %.1f%%' % ends_similarity(p)[0])
