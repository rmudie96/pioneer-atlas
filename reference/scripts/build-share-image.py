"""Render the Atlas's existing typography as a static social preview image."""
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]

def font(family, weight, size):
    source = root / f"node_modules/@fontsource/{family}/files/{family}-latin-{weight}-normal.woff"
    face = TTFont(source)
    face.flavor = None
    buffer = BytesIO()
    face.save(buffer)
    buffer.seek(0)
    return ImageFont.truetype(buffer, size)

# Square composition remains legible in compact messaging thumbnails.
image = Image.new("RGB", (1200, 1200), "#fcfcf8")
draw = ImageDraw.Draw(image)
green, ink = "#086c60", "#162c36"
draw.text((600, 460), "PIONEER.", anchor="mm",
          font=font("ibm-plex-sans", 600, 180), fill=green)
draw.text((600, 640), "AN ECONOMIC ATLAS", anchor="mm",
          font=font("ibm-plex-mono", 400, 55), fill=ink)
draw.text((600, 720), "FOR ENGLAND", anchor="mm",
          font=font("ibm-plex-mono", 400, 55), fill=ink)
image.save(root / "public/pioneer-share-square.png", optimize=True)
