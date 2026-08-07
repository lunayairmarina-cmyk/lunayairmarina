import re
import urllib.request

base = "https://lunayairmarina.vercel.app"
html = urllib.request.urlopen(base + "/about", timeout=30).read().decode("utf-8", "ignore")
pics = re.findall(r"<picture>.*?</picture>", html, re.S)
print("pictures", len(pics))
for p in pics[:2]:
    print(p[:500])
    print("---")
bad = re.findall(r"/assets/[^\"']+\.webp", html)
print("invented asset webps:", bad[:10])
# header img src
imgs = re.findall(r'<img[^>]+alt=""[^>]*>|<img[^>]+aria-hidden[^>]*>', html)
for im in imgs[:3]:
    src = re.search(r'src="([^"]+)"', im)
    print("header-ish img:", src.group(1) if src else im[:120])

for path in [
    "/images/headers/header-about.webp",
    "/images/headers/header-contact.webp",
    "/images/headers/header-blog.webp",
    "/images/headers/header-services.webp",
]:
    try:
        r = urllib.request.urlopen(base + path, timeout=15)
        print("OK", path, r.status, r.headers.get("content-length"))
    except Exception as e:
        print("FAIL", path, getattr(e, "code", e))
