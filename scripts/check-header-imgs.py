import re
import urllib.request

base = "https://lunayairmarina.vercel.app"
for p in ["/about", "/contact", "/blog", "/services", "/application"]:
    html = urllib.request.urlopen(base + p, timeout=30).read().decode("utf-8", "ignore")
    imgs = re.findall(r"<img[^>]+>", html)
    print("===", p, "imgs", len(imgs))
    for im in imgs[:12]:
        src = re.search(r'src="([^"]+)"', im)
        alt = re.search(r'alt="([^"]*)"', im)
        print(" ", (src.group(1)[:140] if src else "?"), "| alt=", (alt.group(1)[:50] if alt else ""))
    # also bg-image style urls
    bgs = re.findall(r'url\(([^)]+)\)', html)
    if bgs:
        print("  bg urls:", bgs[:5])
