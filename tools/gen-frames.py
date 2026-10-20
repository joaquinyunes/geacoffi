"""Genera la secuencia de fotogramas latte -> vaso GEACOFFE para el scroll del hero.

Cámara "se zambulle" en la espuma (zoom + remolino), pasa por una nube ámbar con
partículas de café y se abre sobre el vaso. El primer y el último fotograma son
EXACTAMENTE las dos imágenes de tools/src (sin zoom, giro ni desenfoque).

Uso:  python tools/gen-frames.py [salida] [cantidad]
Requiere: numpy, opencv-python(-headless)
"""
import math
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "public" / "frames"
N = int(sys.argv[2]) if len(sys.argv) > 2 else 150
W, H = 1440, 810
Q = 80

A = cv2.imread(str(ROOT / "src" / "latte.jpg")).astype(np.float32)
B = cv2.imread(str(ROOT / "src" / "vaso.jpg")).astype(np.float32)
SH, SW = A.shape[:2]
assert B.shape == A.shape

ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
nx, ny = xs / W * SW, ys / H * SH  # coords de salida expresadas en píxeles de la fuente


def ease(t):
    t = min(1.0, max(0.0, t))
    return t * t * t * (t * (t * 6 - 15) + 10)


def warp(img, center, zoom, twist, radius):
    """Zoom hacia `center` + remolino que decae con la distancia."""
    cx, cy = center
    dx, dy = nx - cx, ny - cy
    r = np.sqrt(dx * dx + dy * dy)
    ang = twist * np.exp(-((r / radius) ** 2))
    c, s = np.cos(ang), np.sin(ang)
    rx, ry = dx * c - dy * s, dx * s + dy * c
    mx = (cx + rx / zoom).astype(np.float32)
    my = (cy + ry / zoom).astype(np.float32)
    return cv2.remap(img, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def zoom_blur(img, center, zoom, twist, radius, amount, samples=7):
    if amount < 1e-3:
        return warp(img, center, zoom, twist, radius)
    acc = np.zeros((H, W, 3), np.float32)
    for k in range(samples):
        u = k / (samples - 1) - 0.5
        acc += warp(img, center, zoom * (1 + amount * u), twist * (1 + amount * u * 2), radius)
    return acc / samples


# partículas de café / gotas: nacen en el centro y salen disparadas hacia afuera
rng = np.random.default_rng(7)
P = [
    dict(a=rng.uniform(0, 2 * math.pi), v=rng.uniform(0.25, 0.95), b=rng.uniform(0.22, 0.5),
         size=rng.uniform(2, 11), hue=rng.uniform(0, 1), spin=rng.uniform(-1, 1))
    for _ in range(90)
]


def particles(t, env):
    layer = np.zeros((H, W, 3), np.float32)
    if env < 1e-3:
        return layer
    for p in P:
        age = t - p["b"]
        if age < 0 or age > 0.42:
            continue
        life = age / 0.42
        r = (0.04 + p["v"] * 0.62 * ease(life * 0.9 + 0.1)) * W * 0.5
        a = p["a"] + p["spin"] * life
        x = W * 0.5 + math.cos(a) * r * 1.15
        y = H * 0.55 + math.sin(a) * r * 0.78 - life * life * H * 0.12  # sube un poco
        fade = math.sin(math.pi * life) * env
        rad = max(1, int(p["size"] * (0.6 + life) * (1 + r / W)))
        col = (np.array([40, 120, 235]) * (1 - p["hue"]) + np.array([150, 205, 255]) * p["hue"]) * fade * 0.9  # BGR
        cv2.circle(layer, (int(x), int(y)), rad, tuple(float(c) for c in col), -1, cv2.LINE_AA)
    return cv2.GaussianBlur(layer, (0, 0), 1.6) + cv2.GaussianBlur(layer, (0, 0), 9) * 0.8


vig = np.sqrt(((xs / W - 0.5) * 1.15) ** 2 + ((ys / H - 0.5) * 1.0) ** 2)
vig = np.clip(1 - vig * 1.25, 0, 1)[..., None]

OUT.mkdir(parents=True, exist_ok=True)
for old in OUT.glob("frame-*.webp"):
    old.unlink()

CA = (990.0, 585.0)   # centro del latte
CB = (1000.0, 560.0)  # centro del vaso + splash
for i in range(N):
    t = i / (N - 1)
    push = ease(t / 0.56)                       # 0..1 zambullida en la espuma
    pull = ease((t - 0.44) / 0.56)              # 0..1 apertura sobre el vaso
    bump = math.sin(math.pi * ease((t - 0.18) / 0.64))  # 0 en los extremos, 1 en el medio

    za = math.exp(math.log(3.6) * push)
    zb = math.exp(math.log(2.7) * (1 - pull))
    ta = 2.4 * push
    tb = -2.1 * (1 - pull)
    amt = 0.16 * bump

    fa = zoom_blur(A, CA, za, ta, SW * 0.28, amt)
    fb = zoom_blur(B, CB, zb, tb, SW * 0.30, amt)
    w = ease((t - 0.40) / 0.22)
    f = fa * (1 - w) + fb * w

    # nube ámbar + viñeta solo a mitad del recorrido; en los extremos no toca nada
    amber = np.array([30, 90, 200], np.float32) * (0.22 * bump) * vig
    f = f * (1 - 0.28 * bump * (1 - vig)) + amber
    f = f + particles(t, bump)
    f = np.clip(f, 0, 255).astype(np.uint8)
    cv2.imwrite(str(OUT / f"frame-{i + 1:03d}.webp"), f, [cv2.IMWRITE_WEBP_QUALITY, Q])

# sanidad: extremos == fuentes (a la escala de salida)
for idx, src in ((1, A), (N, B)):
    ref = cv2.resize(src, (W, H), interpolation=cv2.INTER_AREA)
    got = cv2.imread(str(OUT / f"frame-{idx:03d}.webp")).astype(np.float32)
    err = float(np.abs(ref - got).mean())
    assert err < 4.0, f"frame {idx} se aleja de la fuente: {err:.2f}"
print(f"{N} fotogramas en {OUT}")
