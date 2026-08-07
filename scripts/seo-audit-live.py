import re
import urllib.request

pages = [
    "/",
    "/about",
    "/services",
    "/contact",
    "/blog",
    "/application",
    "/services/yacht-management-360",
    "/blog/yacht-management-red-sea-guide",
    "/admin/login",
]
base = "https://lunayairmarina.vercel.app"
www = "https://www.lunayairmarina.com"

print("=== VERCEL APP PAGES ===")
for p in pages:
    try:
        html = urllib.request.urlopen(base + p, timeout=30).read().decode("utf-8", "ignore")
    except Exception as e:
        print("PAGE", p, "ERR", e)
        continue
    titles = re.findall(r"<title>(.*?)</title>", html, re.I | re.S)
    canons = re.findall(r'<link[^>]+rel=["\']canonical["\'][^>]*>', html, re.I)
    canon_hrefs = re.findall(r'rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']|href=["\']([^"\']+)["\'][^>]*rel=["\']canonical["\']', html, re.I)
    hrefs = []
    for a, b in canon_hrefs:
        hrefs.append(a or b)
    robots = re.findall(r'name=["\']robots["\'] content=["\']([^"\']+)["\']', html, re.I)
    h1 = len(re.findall(r"<h1[\s>]", html, re.I))
    h2 = len(re.findall(r"<h2[\s>]", html, re.I))
    alts_empty = len(re.findall(r'<img[^>]+alt=["\']["\']', html, re.I))
    imgs = len(re.findall(r"<img[\s>]", html, re.I))
    print(f"PAGE {p}")
    print("  title:", (titles[0][:90] + "...") if titles and len(titles[0]) > 90 else (titles[0] if titles else None))
    print("  robots:", robots[:3])
    print("  canonicals:", hrefs)
    print("  h1/h2:", h1, h2, "imgs/empty-alt:", imgs, alts_empty)

print("\n=== WWW vs VERCEL assets ===")
for path in ["/og-cover.jpg", "/og-image.png", "/robots.txt", "/sitemap.xml", "/favicon.png"]:
    for host in [base, www]:
        try:
            req = urllib.request.Request(host + path, method="HEAD")
            with urllib.request.urlopen(req, timeout=20) as r:
                print(host + path, r.status, r.headers.get("content-type"), r.headers.get("content-length"))
        except Exception as e:
            code = getattr(e, "code", None)
            print(host + path, "ERR", code or e)

print("\n=== WWW homepage title ===")
html = urllib.request.urlopen(www + "/", timeout=30).read().decode("utf-8", "ignore")
titles = re.findall(r"<title>(.*?)</title>", html, re.I | re.S)
print("title:", titles[:1])
print("has next:", "__NEXT_DATA__" in html or "/_next/" in html)
print("has tanstack assets:", "/assets/styles-" in html)
