import os
from PIL import Image, ImageDraw, ImageFont

width, height = 1200, 630
img = Image.new('RGB', (width, height), color='#FFFFFF')
draw = ImageDraw.Draw(img)

# Outer hairline container
draw.rounded_rectangle([40, 40, 1160, 590], radius=24, fill='#FFFFFF', outline='#E5E8EB', width=2)

# Fonts
font_bold = "C:/Windows/Fonts/malgunbd.ttf"
font_regular = "C:/Windows/Fonts/malgun.ttf"

f_wordmark = ImageFont.truetype(font_regular, 22)
f_title = ImageFont.truetype(font_bold, 50)
f_subline = ImageFont.truetype(font_regular, 26)

f_hero_label = ImageFont.truetype(font_regular, 24)
f_hero_num = ImageFont.truetype(font_bold, 76)
f_hero_gain = ImageFont.truetype(font_bold, 28)

f_tag = ImageFont.truetype(font_regular, 20)
f_footer = ImageFont.truetype(font_regular, 20)

# 1. Wordmark & Title
draw.text((80, 80), "육아휴직 계산기", font=f_wordmark, fill='#8B95A1')
draw.text((80, 120), "우리 부부 육아휴직, 매달 얼마 받을까?", font=f_title, fill='#191F28')
draw.text((80, 186), "2026년 10월 기준 고용노동부 공개 기준으로 계산해요", font=f_subline, fill='#4E5968')

# 2. Hero Calculation Showcase (Toss-style flat card)
card_x1, card_y1, card_x2, card_y2 = 80, 245, 1120, 495
draw.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=16, fill='#F2F4F6')

# Left side: Big Hero Number
draw.text((120, 275), "부부가 받는 총 금액", font=f_hero_label, fill='#4E5968')
draw.text((120, 315), "5,620만원", font=f_hero_num, fill='#191F28')
draw.text((120, 420), "6+6 덕분에 1,000만원 더 받아요", font=f_hero_gain, fill='#0B7A6F')

# Right side: Minimalist timeline illustration
# Draw simulated monthly cash flow bars
chart_left = 680
chart_bottom = 445
chart_w = 400
bar_data = [
    (18, 0, 0), (18, 0, 0), (22, 0, 0), (26, 0, 0), (30, 0, 0), (33, 0, 0),
    (12, 18, 48), (12, 18, 0), (12, 22, 0), (12, 26, 0), (12, 30, 0), (12, 33, 0),
    (0, 12, 0), (0, 12, 0), (0, 12, 0), (0, 12, 0), (0, 12, 0), (0, 12, 0)
]
bw = 14
bgap = 7
max_h = 130

# Legend above bars
draw.rectangle([chart_left, 275, chart_left + 12, 287], fill='#0B7A6F')
draw.text((chart_left + 18, 272), "먼저 쉬는 사람", font=f_tag, fill='#4E5968')

draw.rectangle([chart_left + 140, 275, chart_left + 152, 287], fill='#70C0B7')
draw.text((chart_left + 158, 272), "나중에 쉬는 사람", font=f_tag, fill='#4E5968')

draw.rectangle([chart_left + 285, 275, chart_left + 297, 287], fill='#E8A33D')
draw.text((chart_left + 303, 272), "소급 정산", font=f_tag, fill='#4E5968')

# Draw baseline
draw.line([(chart_left - 10, chart_bottom), (chart_left + len(bar_data) * (bw + bgap), chart_bottom)], fill='#E5E8EB', width=1)

for idx, (p1, p2, retro) in enumerate(bar_data):
    bx = chart_left + idx * (bw + bgap)
    curr_y = chart_bottom
    
    # P1 bar
    if p1 > 0:
        h1 = int(p1 * 1.5)
        draw.rounded_rectangle([bx, curr_y - h1, bx + bw, curr_y], radius=3, fill='#0B7A6F')
        curr_y -= h1
        
    # P2 bar
    if p2 > 0:
        h2 = int(p2 * 1.5)
        draw.rounded_rectangle([bx, curr_y - h2, bx + bw, curr_y], radius=3, fill='#70C0B7')
        curr_y -= h2
        
    # Retro bar
    if retro > 0:
        hr = int(retro * 1.5)
        draw.rounded_rectangle([bx, curr_y - hr, bx + bw, curr_y], radius=3, fill='#E8A33D')
        curr_y -= hr

# 3. Footer
draw.text((80, 528), "고용보험법 시행령 제95조·제95조의3 기준 · 순차 사용 소급 정산 반영", font=f_footer, fill='#8B95A1')
draw.text((840, 528), "https://bangsuhyoek.github.io/parental-leave-calc/", font=f_footer, fill='#8B95A1')

out_path = os.path.join(os.path.dirname(__file__), "og-image.png")
img.save(out_path, format="PNG", optimize=True)
print(f"Generated clean minimalist OG image at: {out_path}")

