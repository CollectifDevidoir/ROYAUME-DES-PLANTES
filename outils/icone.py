# Icône d'écran d'accueil : trouée en arche dans la forêt, l'arbre doré du royaume au centre.
# Tout en aplats : arche, butte, arbre (houppier en deux tons d'or, sans contour), même langage graphique.
import math,sys
def bumps(cx,cy,rx,ry,n,amp,a0=-90,jit=None):
    jit=jit or [1]*n
    pts=[(cx+rx*math.cos(math.radians(a0+360*i/n)),cy+ry*math.sin(math.radians(a0+360*i/n))) for i in range(n)]
    d=f'M{pts[0][0]:.1f} {pts[0][1]:.1f}'
    for i in range(n):
        t=math.radians(a0+360*(i+.5)/n);k=1+amp*2*jit[i];p=pts[(i+1)%n]
        d+=f'Q{cx+rx*k*math.cos(t):.1f} {cy+ry*k*math.sin(t):.1f} {p[0]:.1f} {p[1]:.1f}'
    return d+'Z'
J=[1,.85,1.1,.95,1,1.15,.9,1,1.1,.9,1]
def art(s=1):
    canopy=bumps(256,250,106,84,11,.085,-90,J)
    light=bumps(245,230,97,73,11,.085,-90,J)
    trunk='M228 404C240 390 245 370 245 346L245 322L267 322L267 346C267 370 272 390 284 404Z'
    tsh='M256 322L267 322L267 346C267 370 272 390 284 404L264 404C261 382 258 354 256 322Z'
    arch='M104 640V258A152 152 0 0 1 408 258V640Z'
    hill='M104 640V404Q256 374 408 404V640Z'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
<clipPath id="c"><path d="{canopy}"/></clipPath><clipPath id="a"><path d="{arch}"/></clipPath>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d6c45"/><stop offset="1" stop-color="#173f28"/></linearGradient>
<radialGradient id="glo" cx="256" cy="250" r="230" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f6e7a6" stop-opacity=".32"/><stop offset="1" stop-color="#f6e7a6" stop-opacity="0"/></radialGradient>
<linearGradient id="ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf3d6"/><stop offset="1" stop-color="#e3edd3"/></linearGradient>
<radialGradient id="halo" cx="252" cy="236" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff9d9"/><stop offset=".5" stop-color="#fdeaa6" stop-opacity=".9"/><stop offset="1" stop-color="#fdeeb4" stop-opacity="0"/></radialGradient>
<linearGradient id="hi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9159"/><stop offset="1" stop-color="#2f6b3f"/></linearGradient>
<linearGradient id="or" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#f9d266"/><stop offset="1" stop-color="#eaaa3c"/></linearGradient>
<linearGradient id="om" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9962f"/><stop offset="1" stop-color="#b9741f"/></linearGradient>
<linearGradient id="tr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#94613a"/><stop offset=".55" stop-color="#7a4f2e"/><stop offset=".56" stop-color="#5f3c1f"/><stop offset="1" stop-color="#5a381c"/></linearGradient>
<radialGradient id="sh" cx="256" cy="404" r="80" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 404) scale(1 .12) translate(0 -404)"><stop offset="0" stop-color="#1f4a2c" stop-opacity=".7"/><stop offset="1" stop-color="#1f4a2c" stop-opacity="0"/></radialGradient>
</defs>
<rect width="512" height="512" fill="url(#bg)"/>
<g transform="translate(256 262) scale({s}) translate(-256 -262)">
<circle cx="256" cy="250" r="230" fill="url(#glo)"/>
<path d="M104 418V258A152 152 0 0 1 408 258V418Z" fill="url(#ar)"/>
<g clip-path="url(#a)"><circle cx="252" cy="236" r="170" fill="url(#halo)"/></g>
<path d="{hill}" fill="url(#hi)"/><ellipse cx="256" cy="404" rx="80" ry="10" fill="url(#sh)"/>
<path d="{trunk}" fill="url(#tr)"/>
<path d="{canopy}" fill="url(#om)"/>
<path d="{light}" fill="url(#or)" clip-path="url(#c)"/>
</g></svg>'''
D=sys.argv[1] if len(sys.argv)>1 else 'icones'
open(D+'/icone.svg','w').write(art(1));open(D+'/icone-masquable.svg','w').write(art(.82))   # puis export PNG 512, 192, 180 (iPhone)
