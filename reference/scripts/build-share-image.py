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

image = Image.new("RGB", (1200, 630), "#fcfcf8")
draw = ImageDraw.Draw(image)
green, ink = "#086c60", "#162c36"
draw.text((74, 235), "PIONEER.", font=font("ibm-plex-sans", 600, 112), fill=green)
draw.line((630, 240, 630, 351), fill="#ced5d2", width=2)
draw.text((674, 249), "AN ECONOMIC", font=font("ibm-plex-mono", 400, 29), fill=ink)
draw.text((674, 297), "ATLAS FOR ENGLAND", font=font("ibm-plex-mono", 400, 29), fill=ink)
draw.text((600, 453), "Independent Commission on Neighbourhoods", anchor="mm",
          font=font("ibm-plex-sans", 500, 27), fill=green)
image.save(root / "public/pioneer-share.png", optimize=True)
