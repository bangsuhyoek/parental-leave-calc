import os
from PIL import Image, ImageDraw, ImageFont

# 1200 x 630 OG image
width, height = 1200, 630
img = Image.new('RGB', (width, height), color='#0f172a') # Deep Slate Navy
draw = ImageDraw.Draw(img)

# Gradient / Card Background
for y in range(height):
    # subtle gradient from #0f172a (15, 23, 42) to #1e293b (30, 41, 59)
    ratio = y / height
    r = int(15 + (30 - 15) * ratio)
    g = int(23 + (41 - 23) * ratio)
    b = int(42 + (59 - 42) * ratio)
    draw.line([(0, y), (width, y)], fill=(r, g, b))

# Decorative glow circles
# Draw subtle circles in background
glow = Image.new('RGBA', (width, height), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
gdraw.ellipse([850, -100, 1350, 400], fill=(37, 99, 235, 40))   # Blue glow
gdraw.ellipse([-100, 350, 400, 850], fill=(16, 185, 129, 30))   # Emerald glow
img.paste(Image.alpha_composite(Image.new('RGBA', (width, height), (0, 0, 0, 0)), glow), (0, 0), glow)

# Fonts
font_bold = "C:/Windows/Fonts/malgunbd.ttf"
font_regular = "C:/Windows/Fonts/malgun.ttf"

f_badge = ImageFont.truetype(font_bold, 24)
f_title = ImageFont.truetype(font_bold, 54)
f_subtitle = ImageFont.truetype(font_regular, 30)
f_card_label = ImageFont.truetype(font_regular, 22)
f_card_val = ImageFont.truetype(font_bold, 36)
f_footer = ImageFont.truetype(font_regular, 20)

# 1. Badge: "2026 최신 개정 고용보험법 반영"
badge_text = "2026 최신 법령 반영 • 고용보험 공식 산식"
bbox = f_badge.getbbox(badge_text)
bw = bbox[2] - bbox[0] + 36
bh = 46
bx, by = 80, 70
draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=12, fill=(30, 58, 138), outline=(59, 130, 246), width=2)
draw.text((bx + 18, by + 8), badge_text, font=f_badge, fill=(147, 197, 253))

# 2. Main Title
title_text = "육아휴직 급여 계산기"
draw.text((80, 135), title_text, font=f_title, fill=(255, 255, 255))

# 3. Subtitle
sub_text = "6+6 부모함께육아휴직제 • 순차 사용 시 소급 정산 차액 • 한부모 특례"
draw.text((80, 215), sub_text, font=f_subtitle, fill=(203, 213, 225))

# 4. Feature Cards Grid (3 Cards)
card_y = 290
card_h = 210

cards = [
    {
        "x": 80, "w": 320,
        "tag": "6+6 특례 상한액",
        "tag_color": (96, 165, 250),
        "headline": "최대 4,500만원",
        "desc": "1~6개월차 100% 지급\n월 250만~450만원 상한"
    },
    {
        "x": 440, "w": 320,
        "tag": "순차 사용 시 정산",
        "tag_color": (52, 211, 153),
        "headline": "소급 정산 차액",
        "desc": "선사용 부모 일반 급여 수령 후\n두 번째 부모 신청 시 차액 일괄 입금"
    },
    {
        "x": 800, "w": 320,
        "tag": "가구 합산 & 비교",
        "tag_color": (251, 191, 36),
        "headline": "부부 맞춤 시뮬레이션",
        "desc": "일반 휴직 대비 추가 수령액\n월차별 실수령액 상세 내역표"
    }
]

f_card_desc = ImageFont.truetype(font_regular, 20)

for c in cards:
    cx, cw = c["x"], c["w"]
    # Card background
    draw.rounded_rectangle([cx, card_y, cx + cw, card_y + card_h], radius=16, fill=(30, 41, 59, 200), outline=(51, 65, 85), width=2)
    # Tag
    draw.text((cx + 24, card_y + 24), c["tag"], font=f_card_label, fill=c["tag_color"])
    # Headline
    draw.text((cx + 24, card_y + 60), c["headline"], font=f_card_val, fill=(255, 255, 255))
    # Desc
    draw.text((cx + 24, card_y + 120), c["desc"], font=f_card_desc, fill=(148, 163, 184))

# 5. Footer info
footer_text = "출처: 고용보험법 시행령 제95조·제95조의3 | 고용노동부(1350) 및 고용24 공식 기준"
draw.text((80, 545), footer_text, font=f_footer, fill=(100, 116, 139))

url_text = "https://bangsuhyoek.github.io/parental-leave-calc/"
ubbox = f_footer.getbbox(url_text)
uw = ubbox[2] - ubbox[0]
draw.text((1200 - 80 - uw, 545), url_text, font=f_footer, fill=(59, 130, 246))

out_path = os.path.join(os.path.dirname(__file__), "og-image.png")
img.save(out_path, format="PNG", optimize=True)
print(f"Generated OG image at: {out_path} ({width}x{height})")

