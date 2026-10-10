# Placeholder brand assets (logo, PWA icons, favicon, OG image).
# Usage: python3 scripts/generate-brand-assets.py public
# Replace the outputs with designer artwork when available (same filenames/sizes).
import sys
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]
ORANGE=(255,107,53); TERRA=(201,125,96); CREAM=(245,241,232); SAGE=(135,169,107); INK=(33,33,33); WHITE=(255,255,255)
SERIF_B='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def leaf(d, cx, cy, s, color):
    import math
    # vesica leaf (pointed both ends), tilted 40 degrees, with a midrib
    ang=math.radians(40); half=s; width=s*0.55
    pts=[]
    for i in range(0,41):
        t=-1+i/20.0
        if t>1: break
        pts.append((t*half, width*(1-t*t)))
    pts += [(x,-y) for x,y in reversed(pts)]
    rot=[(cx + x*math.cos(ang) - y*math.sin(ang), cy - (x*math.sin(ang) + y*math.cos(ang))) for x,y in pts]
    d.polygon(rot, fill=color)
    p1=(cx - half*0.8*math.cos(ang), cy + half*0.8*math.sin(ang)); p2=(cx + half*0.8*math.cos(ang), cy - half*0.8*math.sin(ang))
    d.line([p1,p2], fill=(232,120,80,255), width=max(2,int(s*0.08)))

def icon(size, pad_ratio=0.0):
    S=size*4
    im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im)
    # vertical gradient orange->terracotta
    grad=Image.new('RGBA',(S,S))
    gd=ImageDraw.Draw(grad)
    for y in range(S):
        t=y/S; c=tuple(int(ORANGE[i]*(1-t)+TERRA[i]*t) for i in range(3))+(255,)
        gd.line([(0,y),(S,y)],fill=c)
    mask=Image.new('L',(S,S),0)
    ImageDraw.Draw(mask).rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.22) if pad_ratio==0 else 0,fill=255)
    im.paste(grad,(0,0),mask)
    d=ImageDraw.Draw(im)
    f=ImageFont.truetype(SERIF_B,int(S*0.62))
    bbox=d.textbbox((0,0),'h',font=f); w=bbox[2]-bbox[0]; h=bbox[3]-bbox[1]
    x=(S-w)/2-bbox[0]-S*0.04; y=(S-h)/2-bbox[1]+S*0.03
    d.text((x,y),'h',font=f,fill=WHITE)
    leaf(d, S*0.71, S*0.28, S*0.15, (255,255,255,240))
    return im.resize((size,size),Image.LANCZOS)

for n,sz in [('icon-512.png',512),('icon-192.png',192),('logo.png',512),('apple-touch-icon.png',180)]:
    img=icon(sz)
    if n=='apple-touch-icon.png':
        bg=Image.new('RGBA',(sz,sz),ORANGE+(255,)); bg.alpha_composite(icon(sz,1)); img=bg
    img.save(f'{out}/{n}',optimize=True)
# maskable variants: full-bleed with safe zone
m=Image.new('RGBA',(512,512),ORANGE+(255,)); inner=icon(360); m.alpha_composite(inner,(76,76)); m.save(f'{out}/icon-maskable-512.png',optimize=True)
icon(64).save(f'{out}/favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])

# OG image 1200x630
W,H=1200,630
og=Image.new('RGB',(W,H),CREAM); d=ImageDraw.Draw(og)
d.rectangle([0,H-18,W,H],fill=ORANGE)
d.ellipse([W-420,-220,W+180,380],fill=(250,226,210))
d.ellipse([W-300,H-260,W+100,H+140],fill=(226,236,214))
og.paste(icon(200),(90,90),icon(200))
fb=ImageFont.truetype(SERIF_B,96); fs=ImageFont.truetype(SANS,40); fx=ImageFont.truetype(SANS,30)
d.text((90,320),'heldeelife',font=fb,fill=INK)
d.text((92,440),'Authentic Ayurveda & Modern Medicine',font=fs,fill=(80,80,80))
d.text((92,505),'Natural wellness, delivered across India',font=fx,fill=ORANGE)
og.save(f'{out}/og-image.jpg',quality=88,optimize=True)
print('ok')
