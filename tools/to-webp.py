"""Versiones livianas (.webp) de las fotos para las páginas Carta y Armar pedido.
Los PNG/JPG originales no se tocan (la home los sigue usando como texturas).

Uso:  python tools/to-webp.py
Requiere: numpy, opencv-python(-headless)
"""
from pathlib import Path

import cv2

PUB = Path(__file__).resolve().parent.parent / "public"


def convert(src: Path, max_side: int, quality: int):
    im = cv2.imread(str(src), cv2.IMREAD_COLOR)  # los PNG de producto son opacos: se descarta el alfa
    h, w = im.shape[:2]
    k = min(1.0, max_side / max(h, w))
    if k < 1:
        im = cv2.resize(im, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)
    out = src.with_suffix(".webp")
    cv2.imwrite(str(out), im, [cv2.IMWRITE_WEBP_QUALITY, quality])
    print(f"{out.relative_to(PUB)}  {out.stat().st_size // 1024} KB")


for p in sorted((PUB / "img").glob("*.png")):
    convert(p, 900, 84)
for p in sorted((PUB / "studio").glob("*.jpg")):
    convert(p, 1280, 78)
