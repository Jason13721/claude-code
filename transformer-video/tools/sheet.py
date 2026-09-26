# contact sheet: python3 tools/sheet.py out.jpg a.jpg b.jpg ...  (2 columns, 960x540 tiles)
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
import os
cols = int(os.environ.get('COLS', 2)); tw, th = 1920 // cols, 1080 // cols; rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (tw * cols, th * rows), 'black')
for i, f in enumerate(files):
    im = Image.open(f).resize((tw, th))
    ImageDraw.Draw(im).text((10, 10), f.split('/')[-1], fill='yellow')
    sheet.paste(im, ((i % cols) * tw, (i // cols) * th))
sheet.save(out, quality=80)
