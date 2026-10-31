# 运动清单的动作图解：生成 src/content/stacks/workout/*.svg
# 用法：python3 scripts/workout-figures.py && node scripts/workout-figures-png.mjs
# 风格：浅底 + 黑色线稿小人 + 站点蓝色标注（角度、箭头、节奏）。改图就改这里，重新跑一次。
import base64
import math
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "src/content/stacks/workout"
INK, FAR, GHOST, ACCENT, DANGER, BG, LINE = "#0a0a0d", "#8d8d93", "#c4c4c8", "#3d5afe", "#c62828", "#f7f6f2", "#d9d6cd"
FONT = "Noto Sans CJK SC, Noto Sans SC, PingFang SC, sans-serif"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def line(pts, color=INK, w=11, dash=None, cap="round"):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<polyline points="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="{cap}" stroke-linejoin="round"{da}/>'


def circle(c, r, color=INK, fill=None, w=8, dash=None):
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<circle cx="{c[0]}" cy="{c[1]}" r="{r}" fill="{fill or BG}" stroke="{color}" stroke-width="{w}"{da}/>'


def rect(x, y, w, h, fill="#fff", stroke=INK, sw=4, r=6, dash=None):
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>'


def text(x, y, s, size=24, color=INK, weight=500, anchor="start"):
    return f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{esc(s)}</text>'


def note(x, y, s, anchor="start", color=ACCENT, size=23):
    """蓝色小标签：左边一个圆点 + 文字"""
    dot = x - 14 if anchor == "start" else (x + 14 if anchor == "end" else None)
    out = text(x, y, s, size=size, color=color, weight=700, anchor=anchor)
    if dot is not None:
        out = f'<circle cx="{dot}" cy="{y - size * 0.35:.1f}" r="5" fill="{color}"/>' + out
    return out


def arrow(p1, p2, color=ACCENT, w=5, head=16, dash=None):
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    a1 = (p2[0] - head * math.cos(ang - 0.45), p2[1] - head * math.sin(ang - 0.45))
    a2 = (p2[0] - head * math.cos(ang + 0.45), p2[1] - head * math.sin(ang + 0.45))
    tip = (p2[0] - head * 0.6 * math.cos(ang), p2[1] - head * 0.6 * math.sin(ang))
    return line([p1, tip], color, w, dash) + f'<polygon points="{p2[0]:.1f},{p2[1]:.1f} {a1[0]:.1f},{a1[1]:.1f} {a2[0]:.1f},{a2[1]:.1f}" fill="{color}"/>'


def arc(c, r, a0, a1, label=None, color=ACCENT, lr=None, size=24):
    """角度弧线，a0→a1 为数学角度（度，0=右，90=上）"""
    def pt(a, rr):
        return (c[0] + rr * math.cos(math.radians(a)), c[1] - rr * math.sin(math.radians(a)))
    s, e = pt(a0, r), pt(a1, r)
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 0 if a1 > a0 else 1
    out = f'<path d="M{s[0]:.1f},{s[1]:.1f} A{r},{r} 0 {large} {sweep} {e[0]:.1f},{e[1]:.1f}" fill="none" stroke="{color}" stroke-width="4"/>'
    if label:
        m = pt((a0 + a1) / 2, lr or r + 30)
        out += text(m[0], m[1] + 8, label, size=size, color=color, weight=800, anchor="middle")
    return out


def figure(j, color=INK, far=FAR, dash=None, w=11, head_w=7):
    """j: 关节坐标。far_* 是远侧肢体（灰色），其余是近侧（黑色）。"""
    out = []
    for a, b in (("far_shoulder", "far_elbow"), ("far_elbow", "far_hand"), ("far_hip", "far_knee"), ("far_knee", "far_ankle"), ("far_ankle", "far_toe")):
        if a in j and b in j:
            out.append(line([j[a], j[b]], far if not dash else color, w - 1, dash))
    out.append(line([j["shoulder"], j["hip"]], color, w + 4, dash))
    for a, b in (("hip", "knee"), ("knee", "ankle"), ("ankle", "toe"), ("shoulder", "elbow"), ("elbow", "hand")):
        if a in j and b in j:
            out.append(line([j[a], j[b]], color, w, dash))
    # 脖子：肩膀连到头的边缘，头偏前时也不会悬空
    (sx, sy), (hx, hy), r = j["shoulder"], j["head"], j.get("r", 27)
    dist = math.hypot(hx - sx, hy - sy)
    if dist > r:
        out.append(line([(sx, sy), (hx - (hx - sx) * r / dist, hy - (hy - sy) * r / dist)], color, w - 2, dash))
    out.append(circle(j["head"], r, color, w=head_w, dash=dash))
    return "".join(out)


def ghost(j):
    return figure(j, GHOST, dash="10 9", w=8)


def frame(title, body, cue=None):
    head = text(48, 70, "动作图解", size=22, color=ACCENT, weight=800) + text(48, 112, title, size=36, weight=900)
    foot = ""
    if cue:
        foot = f'<rect x="0" y="752" width="800" height="48" fill="{INK}"/>' + text(400, 784, cue, size=22, color="#fff", weight=700, anchor="middle")
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">'
        f'<rect width="800" height="800" fill="{BG}"/>{head}{body}{foot}</svg>'
    )


def photo(x, y, w, h, name):
    """嵌入真人照片（src/content/stacks/workout/grip-*.jpg，640×640 方图），居中裁成 w×h"""
    data = base64.b64encode((OUT / name).read_bytes()).decode()
    return (f'<clipPath id="c-{name}-{x}-{y}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath>'
            f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c-{name}-{x}-{y})" href="data:image/jpeg;base64,{data}"/>')


def photo_panel(x, y, w, h, kind, caption=True):
    """真人握姿照片：half = ✓ 半抠（拇指放松垂下）；lock = × 拇指锁全抠（拇指压指甲）"""
    ok = kind == "half"
    col = "#2e7d32" if ok else DANGER
    head = "✓ 正确：半抠 Half Crimp" if ok else "× 禁止：拇指锁全抠"
    out = rect(x, y, w, h + 40, fill=col, stroke=col, sw=0, r=10)
    out += text(x + w / 2, y + 28, head, size=21, color="#fff", weight=800, anchor="middle")
    out += photo(x, y + 40, w, h, "grip-half-crimp.jpg" if ok else "grip-thumb-lock.jpg")
    out += f'<rect x="{x}" y="{y}" width="{w}" height="{h + 40}" rx="10" fill="none" stroke="{col}" stroke-width="5"/>'
    sx = w / 640
    if ok:
        tx, ty = x + 486 * sx, y + 40 + 318 * sx      # 拇指：放松垂在一边
        out += circle((tx, ty), 34 * sx * 1.6, "#2e7d32", fill="none", w=4)
        out += rect(tx - 64, ty + 34 * sx * 1.6 + 6, 128, 30, fill="#2e7d32", stroke="#2e7d32", sw=0, r=6)
        out += text(tx, ty + 34 * sx * 1.6 + 28, "拇指放松", size=18, color="#fff", weight=800, anchor="middle")
    else:
        tx, ty = x + 460 * sx, y + 40 + 222 * sx      # 拇指压住食指 / 中指指甲
        out += circle((tx, ty), 42 * sx * 1.6, DANGER, fill="none", w=5)
        out += rect(tx - 76, ty + 42 * sx * 1.6 + 6, 152, 30, fill=DANGER, stroke=DANGER, sw=0, r=6)
        out += text(tx, ty + 42 * sx * 1.6 + 28, "拇指压指甲", size=18, color="#fff", weight=800, anchor="middle")
    if caption:
        cap = ("第二指节约 90°，指尖平直", "拇指放松垂下，不压指甲") if ok else ("拇指压住食指 / 中指指甲", "就是全抠，Max Hang 禁止")
        out += text(x + w / 2, y + h + 70, cap[0], size=18, weight=700, anchor="middle")
        out += text(x + w / 2, y + h + 96, cap[1], size=18, color=col, weight=700, anchor="middle")
    return out


def floor(y, x0=40, x1=760):
    return line([(x0, y), (x1, y)], LINE, 4, cap="butt")


def hangboard(x, y, w=240):
    """门框指力板：上方宽沿 Jug + 中间 20mm 洞"""
    return (
        rect(x, y, w, 52, fill="#e9dcc0", stroke=INK, sw=4, r=8)
        + rect(x + 28, y + 30, w - 56, 12, fill=INK, stroke=INK, sw=0, r=3)
        + line([(x - 30, y - 6), (x + w + 30, y - 6)], INK, 6, cap="butt")
    )


def dumbbell(c, vertical=True, size=1.0):
    x, y = c
    L, pw, ph = 56 * size, 44 * size, 16 * size
    if vertical:
        return (line([(x, y - L / 2), (x, y + L / 2)], INK, 7)
                + rect(x - pw / 2, y - L / 2 - ph, pw, ph, fill=INK, sw=0, r=4)
                + rect(x - pw / 2, y + L / 2, pw, ph, fill=INK, sw=0, r=4))
    return (line([(x - L / 2, y), (x + L / 2, y)], INK, 7)
            + rect(x - L / 2 - ph, y - pw / 2, ph, pw, fill=INK, sw=0, r=4)
            + rect(x + L / 2, y - pw / 2, ph, pw, fill=INK, sw=0, r=4))


svgs = {}

# 1. 肩胛骨激活引体 -------------------------------------------------------------
def scap():
    b = hangboard(280, 150)
    base = dict(hand=(400, 182), far_hand=(388, 182), r=27)
    def body(sy):
        return dict(base, shoulder=(400, sy), far_shoulder=(394, sy), elbow=(400, (sy + 182) / 2), far_elbow=(392, (sy + 182) / 2),
                    head=(442, sy - 20), hip=(404, sy + 170), far_hip=(400, sy + 170),
                    knee=(420, sy + 280), far_knee=(412, sy + 282), ankle=(404, sy + 384), far_ankle=(398, sy + 386),
                    toe=(426, sy + 392), far_toe=(420, sy + 394))
    b += ghost(body(352)) + figure(body(326))
    b += floor(745)
    b += arrow((560, 440), (560, 392)) + note(586, 425, "身体上移 3–5 cm")
    b += arrow((300, 300), (300, 352)) + note(286, 330, "肩胛下沉", anchor="end")
    b += note(286, 368, "后收", anchor="end")
    b += arc((400, 182), 30, 230, 310, None) + note(586, 225, "手臂全程伸直")
    b += note(586, 520, "顶端锁住 3 秒")
    b += note(586, 560, "再慢慢还原")
    b += text(586, 270, "抓最上方宽沿（Jug）", size=22, color=FAR, weight=600)
    return frame("肩胛骨激活引体", b, "自重 · 2 组 × 8 次 · 组间休息 30 秒")


# 2. Max Hangs ------------------------------------------------------------------
def maxhang():
    b = photo_panel(40, 136, 352, 300, "half") + photo_panel(408, 136, 352, 300, "lock")
    j = dict(hand=(230, 182), far_hand=(218, 182), elbow=(240, 268), far_elbow=(230, 268), shoulder=(232, 352), far_shoulder=(226, 352),
             head=(276, 330), hip=(236, 522), far_hip=(232, 522), knee=(256, 632), far_knee=(246, 634), ankle=(240, 732), far_ankle=(232, 734),
             toe=(262, 738), far_toe=(254, 740), r=30)
    b += f'<g transform="translate(20 504) scale(0.3)">{hangboard(110, 150)}{figure(j, w=22, head_w=14)}</g>'
    b += note(170, 598, "双脚离地，沉肩不耸肩", size=21) + note(170, 642, "手肘约 170°，微屈不锁死", size=21)
    b += note(170, 686, "7 秒缓慢吐气，不憋气", size=21)
    b += note(480, 598, "撑不满：单脚点地卸力", color=INK, size=21)
    b += text(480, 640, "宁可减重，也不改成全抠", size=20, color=DANGER, weight=700)
    b += text(480, 680, "指尖反折、折过 90° 也不行", size=20, color=DANGER, weight=700)
    return frame("双脚离地最大悬垂（Max Hangs）", b, "7 秒全力 + 113 秒休息 × 4 组 · 半抠 / 开放握，拇指放松")


# 3. 高脚杯全蹲 -----------------------------------------------------------------
def goblet():
    up = dict(head=(316, 220), shoulder=(300, 262), hip=(300, 432), knee=(304, 552), ankle=(300, 672), toe=(344, 676), r=27)
    down = dict(head=(430, 422), shoulder=(420, 470), far_shoulder=(418, 470), hip=(376, 640), far_hip=(370, 638),
                knee=(488, 604), far_knee=(478, 600), ankle=(430, 694), far_ankle=(422, 694), toe=(478, 698), far_toe=(470, 698),
                elbow=(452, 562), hand=(466, 514), r=27)
    b = ghost(up) + floor(705, 200, 600) + figure(down) + dumbbell((470, 504))
    b += arrow((236, 300), (236, 560)) + note(216, 330, "3 秒", anchor="end") + note(216, 370, "慢蹲", anchor="end")
    b += arrow((110, 560), (110, 340), color=INK) + note(96, 590, "1 秒", anchor="end", color=INK) + note(96, 630, "爆发", anchor="end", color=INK) + note(96, 670, "站起", anchor="end", color=INK) + note(96, 710, "呼气", anchor="end", color=INK)
    b += note(540, 470, "哑铃捧在锁骨下")
    b += note(540, 640, "大腿后侧贴小腿")
    b += note(540, 680, "底停 1 秒，核心收紧")
    # 俯视脚尖外展 30°
    ox, oy = 560, 170
    b += rect(ox, oy, 190, 200, fill="#fff", stroke=INK, sw=3, r=14) + text(ox + 95, oy + 30, "俯视双脚", size=20, color=FAR, weight=700, anchor="middle")
    for sgn in (-1, 1):
        cx, cy = ox + 95 + sgn * 46, oy + 150
        a = math.radians(90 - sgn * 30)
        tip = (cx + 70 * math.cos(a), cy - 70 * math.sin(a))
        b += line([(cx, cy), tip], INK, 22)
        b += line([(cx, cy), (cx, cy - 76)], ACCENT, 3, dash="6 6")
        b += arc((cx, cy), 46, 90, 90 - sgn * 30, None)
    b += text(ox + 95, oy + 186, "脚尖外展约 30°", size=20, color=ACCENT, weight=800, anchor="middle")
    return frame("大重量高脚杯全蹲", b, "20–24 kg 起，熟练后 28–32 kg · 4 组 × 6–8 次 · 休息 120 秒")


# 4. 保加利亚分腿蹲 -------------------------------------------------------------
def bulgarian():
    b = rect(110, 560, 190, 30, fill="#fff", stroke=INK, sw=4, r=6) + line([(130, 590), (130, 700)], INK, 8) + line([(280, 590), (280, 700)], INK, 8)
    j = dict(hip=(430, 578), shoulder=(474, 414), head=(492, 378),
             knee=(548, 590), ankle=(530, 696), toe=(578, 700),
             far_hip=(426, 578), far_knee=(392, 684), far_ankle=(270, 560), far_toe=(250, 548),
             elbow=(460, 498), hand=(452, 574), r=27)
    j2 = dict(j)
    b += floor(705, 60, 740)
    # 后腿用黑色更清楚
    b += line([j["hip"], j["far_knee"], j["far_ankle"], j["far_toe"]], "#55555b", 11)
    b += figure({k: v for k, v in j.items() if not k.startswith("far_")}) + dumbbell((452, 588), vertical=False, size=0.8)
    b += line([(430, 578), (430, 400)], ACCENT, 3, dash="6 6") + arc((430, 578), 120, 90, 75, "15°", lr=146, size=22)
    b += line([(392, 698), (392, 705)], ACCENT, 3) + note(330, 740, "后膝离地约 2 cm", anchor="middle")
    b += note(205, 540, "凳高约 40 cm", anchor="middle")
    b += arrow((560, 690), (560, 620), color=INK) + note(590, 640, "前脚跟推起", color=INK)
    b += note(560, 400, "躯干微前倾 15°")
    b += note(560, 500, "3 秒下 · 底停 1 秒")
    return frame("哑铃保加利亚分腿蹲", b, "双手各 10–14 kg · 每侧 3 × 8 · 左右连做 · 组休 90 秒")


# 5. 折刀俯卧撑 / 靠墙倒立撑 -----------------------------------------------------
def pike():
    b = rect(110, 470, 170, 28, fill="#fff", stroke=INK, sw=4, r=6) + line([(130, 498), (130, 690)], INK, 8) + line([(260, 498), (260, 690)], INK, 8)
    b += line([(520, 640), (520, 690)], INK, 7) + line([(600, 640), (600, 690)], INK, 7) + line([(510, 636), (610, 636)], INK, 10)  # parallettes
    j = dict(hand=(560, 632), elbow=(556, 545), shoulder=(548, 455), hip=(420, 300), knee=(336, 380), ankle=(250, 466), toe=(236, 440),
             head=(584, 488), r=26)
    b += floor(695, 60, 740) + figure(j)
    b += arc((420, 300), 40, 215, 315, "倒 V", lr=-30)
    b += note(620, 560, "直腕")
    b += note(620, 600, "撑在支架上")
    b += note(620, 680, "大臂内收 45°")
    b += text(620, 712, "手肘不外翻", size=21, weight=600)
    b += arrow((660, 420), (660, 500)) + note(680, 440, "3 秒放")
    b += note(680, 480, "吸气")
    b += note(195, 735, "椅高 40–50 cm", anchor="middle")
    b += note(330, 250, "收腹夹臀，不塌腰", anchor="middle")
    # 俯视：手、头三角形 + 大臂 45°
    ox, oy = 560, 150
    b += rect(ox, oy, 200, 210, fill="#fff", stroke=INK, sw=3, r=14) + text(ox + 100, oy + 30, "俯视", size=20, color=FAR, weight=700, anchor="middle")
    h1, h2, hd = (ox + 52, oy + 170), (ox + 148, oy + 170), (ox + 100, oy + 87)
    b += f'<polygon points="{h1[0]},{h1[1]} {h2[0]},{h2[1]} {hd[0]},{hd[1]}" fill="none" stroke="{ACCENT}" stroke-width="3" stroke-dasharray="6 5"/>'
    b += circle(h1, 11, INK, fill=INK, w=2) + circle(h2, 11, INK, fill=INK, w=2) + circle(hd, 20, INK, w=5)
    b += text(ox + 100, oy + 200, "头顶与双手成三角", size=18, color=ACCENT, weight=800, anchor="middle")
    return frame("支架垫高折刀俯卧撑", b, "自重 · 4 组 × 6–8 次 · 休息 90 秒 · 标准 8 次后进阶靠墙倒立撑")


# 6. 负重俯卧撑 -----------------------------------------------------------------
def weighted():
    b = line([(560, 340), (560, 382)], INK, 7) + line([(620, 340), (620, 382)], INK, 7) + line([(550, 336), (630, 336)], INK, 10)
    j = dict(toe=(112, 382), ankle=(130, 368), knee=(240, 340), hip=(352, 312), shoulder=(590, 250), elbow=(590, 292), hand=(590, 334),
             head=(634, 234), r=24)
    b += floor(385, 60, 740) + figure(j, w=10)
    b += '<g transform="translate(470,262) rotate(-15)">' + rect(-45, -34, 90, 30, fill=ACCENT, stroke=INK, sw=3, r=6) + '</g>' 
    b += note(450, 205, "背负 10–15 kg", anchor="middle")
    b += note(110, 205, "3 秒下放 · 1 秒推起")
    # 俯视：45° 箭头 vs 90° T
    def top(ox, oy, deg, ok):
        o = rect(ox, oy, 300, 300, fill="#fff", stroke=INK, sw=3, r=14)
        cx, sy = ox + 150, oy + 110
        o += line([(cx, sy), (cx, sy + 116)], INK, 34) + circle((cx, sy - 40), 22, INK, w=6)
        for sgn in (-1, 1):
            a = math.radians(deg)
            sh = (cx + sgn * 30, sy + 4)
            el = (sh[0] + sgn * 90 * math.sin(a), sh[1] + 90 * math.cos(a))
            o += line([sh, el], INK, 12)
            o += line([sh, (sh[0], sh[1] + 90)], ACCENT if ok else DANGER, 3, dash="6 6")
            o += arc(sh, 52, -90, -90 + sgn * deg, None, color=ACCENT if ok else DANGER)
        lab = f"{deg}°"
        o += text(ox + 150, oy + 282, ("✓ 大臂与躯干 45°" if ok else "✕ 90° T 字"), size=22, color=ACCENT if ok else DANGER, weight=800, anchor="middle")
        o += text(ox + 34, oy + 40, "俯视", size=18, color=FAR, weight=700)
        return o
    b += top(70, 425, 45, True) + top(430, 425, 90, False)
    return frame("支架负重俯卧撑", b, "背负 10–15 kg 或各手 18–22 kg 卧推 · 4 组 × 8–10 · 休息 90 秒")


# 7. 哥萨克蹲 + PNF 横叉 -------------------------------------------------------
def cossack():
    # 正视哥萨克蹲
    b = floor(470, 60, 740)
    hip, sh = (330, 380), (340, 230)
    b += line([sh, hip], INK, 15) + circle((344, 192), 26, INK, w=7)
    b += line([(320, 382), (230, 360), (220, 462)], INK, 11) + line([(220, 462), (190, 466)], INK, 11)  # 弯曲腿
    b += line([(342, 384), (620, 452)], INK, 11) + line([(620, 452), (626, 418)], INK, 11)  # 直腿脚尖朝上
    b += line([(320, 240), (306, 300), (330, 280)], INK, 10) + line([(360, 240), (376, 300), (352, 282)], INK, 10)
    b += dumbbell((341, 282), vertical=True, size=0.7)
    b += note(420, 220, "胸前 8–12 kg")
    b += note(480, 350, "直腿脚尖朝上")
    b += note(110, 320, "膝盖对脚尖", anchor="start")
    b += text(48, 152, "① 哥萨克蹲（正视）", size=22, color=FAR, weight=700)
    # PNF 横叉
    b += text(48, 522, "② PNF 横叉（正视）", size=22, color=FAR, weight=700)
    b += floor(705, 60, 740)
    b += line([(400, 640), (160, 698)], INK, 11) + line([(400, 640), (640, 698)], INK, 11)
    b += line([(400, 640), (400, 520)], INK, 15) + circle((400, 486), 24, INK, w=7)
    b += line([(400, 540), (330, 610), (330, 698)], INK, 9) + line([(400, 540), (470, 610), (470, 698)], INK, 9)
    b += arrow((150, 640), (200, 690)) + arrow((650, 640), (600, 690))
    b += note(70, 568, "10 秒 脚跟向下向内夹地")
    b += arrow((520, 560), (520, 630), color=INK) + note(540, 580, "20 秒 放松", color=INK) + note(540, 615, "深呼气、盆骨下沉", color=INK)
    return frame("负重哥萨克蹲 + PNF 横叉", b, "哥萨克蹲 2 组 × 每侧 6 · 横叉 PNF 3 轮（夹 10 秒 + 松 20 秒）")


# 8. No-Hangs -------------------------------------------------------------------
def nohang():
    b = hangboard(60, 150)
    j = dict(hand=(180, 182), far_hand=(168, 182), elbow=(174, 268), far_elbow=(166, 268), shoulder=(166, 352), far_shoulder=(160, 352),
             head=(210, 330), hip=(152, 520), far_hip=(148, 520), knee=(212, 612), far_knee=(204, 616), ankle=(178, 712), far_ankle=(170, 714),
             toe=(222, 718), far_toe=(214, 718))
    b += figure(j) + floor(722, 40, 440)
    b += arrow((120, 470), (120, 560))
    b += note(268, 452, "臀部往下坐") + note(268, 492, "部分体重交给手指")
    b += note(250, 700, "双脚始终踩地")
    b += photo_panel(470, 140, 290, 290, "half")
    b += note(484, 590, "手指拉力约 30–35 kg")
    b += text(484, 624, "约体重的 40–50%", size=21, color=INK, weight=600)
    b += note(484, 670, "前臂温和充血")
    b += text(484, 704, "不酸、不累就对了", size=21, color=INK, weight=600)
    return frame("双脚踩地减重悬垂（No-Hangs）", b, "拉紧 10 秒 + 放松 20 秒 × 6 · 半抠 / 开放握，拇指放松")


# 9. 攀岩热身 -------------------------------------------------------------------
def warmup():
    b = floor(700, 60, 360)
    b += line([(210, 300), (210, 470)], INK, 15) + circle((210, 262), 26, INK, w=7)
    b += line([(210, 470), (180, 580), (176, 692)], INK, 11) + line([(210, 470), (240, 580), (244, 692)], INK, 11)
    b += line([(196, 306), (120, 240)], INK, 11) + line([(224, 306), (300, 240)], INK, 11)
    for cx in (120, 300):
        b += f'<path d="M{cx - 40},{240} A40,40 0 1 1 {cx},{280}" fill="none" stroke="{ACCENT}" stroke-width="4"/>'
        b += arrow((cx + 6, 281), (cx - 4, 280), head=14)
    b += note(210, 160, "手腕 + 肩袖环绕", anchor="middle")
    # 墙
    b += rect(420, 150, 320, 560, fill="#fff", stroke=INK, sw=4, r=4)
    for (x, y) in ((470, 230), (620, 260), (560, 380), (690, 420), (500, 520), (640, 600), (520, 660)):
        b += f'<ellipse cx="{x}" cy="{y}" rx="16" ry="11" fill="{FAR}"/>'
    b += line([(588, 450), (588, 540)], INK, 15) + circle((588, 418), 22, INK, w=6)
    b += line([(578, 456), (562, 388)], INK, 10) + line([(598, 456), (620, 268)], INK, 10)
    b += line([(588, 540), (520, 528)], INK, 10) + line([(588, 540), (636, 596)], INK, 10)
    b += note(430, 740, "V0–V1 · 手臂伸直 · 脚步无声")
    return frame("攀岩热身", b, "10 分钟 · 先关节环绕，再爬 V0–V1 简单线")


# 10. 抱石 ----------------------------------------------------------------------
def boulder():
    b = f'<polygon points="80,690 300,150 700,150 700,690" fill="#fff" stroke="{INK}" stroke-width="4"/>'
    b += rect(70, 690, 660, 40, fill="#e4e1d8", stroke=INK, sw=3, r=6) + text(400, 718, "防摔垫", size=18, color=FAR, weight=700, anchor="middle")
    holds = [(360, 600), (420, 500), (520, 420), (470, 330), (590, 250), (640, 180)]
    for x, y in holds:
        b += f'<ellipse cx="{x}" cy="{y}" rx="20" ry="13" fill="{ACCENT}"/>'
    b += line(holds, ACCENT, 3, dash="4 8")
    b += line([(470, 410), (470, 500)], INK, 15) + circle((470, 378), 22, INK, w=6)
    b += line([(458, 418), (468, 340)], INK, 10) + line([(482, 418), (518, 425)], INK, 10)
    b += line([(470, 500), (420, 500)], INK, 10) + line([(470, 500), (500, 590), (362, 602)], INK, 10)
    b += rect(110, 190, 200, 110, fill=INK, stroke=INK, sw=0, r=12)
    b += text(210, 236, "每条线 15–40 秒", size=22, color="#fff", weight=800, anchor="middle")
    b += text(210, 274, "爬到力竭前就够", size=19, color="#cfd3ff", weight=600, anchor="middle")
    b += note(600, 520, "脱落后", anchor="middle") + note(600, 556, "强制休息 3–5 分钟", anchor="middle")
    b += text(600, 592, "不疲劳连上", size=20, color=INK, weight=700, anchor="middle")
    return frame("极限抱石", b, "40 分钟 · 短线路、高质量，每次尝试都用全力")


# 11. Double Tabata --------------------------------------------------------------
def tabata():
    b = ""
    def row(yy, label):
        o = text(70, yy - 140, label, size=24, weight=800)
        xx = 70
        for i in range(8):
            o += rect(xx, yy - 110, 20 * 2.6, 110, fill=ACCENT, stroke=ACCENT, sw=0, r=4)
            o += rect(xx + 20 * 2.6, yy - 34, 10 * 2.6, 34, fill=GHOST, stroke=GHOST, sw=0, r=3)
            xx += 30 * 2.6
        o += line([(70, yy), (70 + 240 * 2.6, yy)], INK, 3, cap="butt")
        return o
    b += row(330, "第 1 轮 Tabata · 4 分钟")
    b += rect(70, 356, 624, 56, fill="#fff", stroke=INK, sw=3, r=10, dash="8 6")
    b += text(382, 392, "直立慢走 2 分钟（让心率回落，不坐下）", size=22, weight=700, anchor="middle")
    b += row(600, "第 2 轮 Tabata · 4 分钟")
    b += rect(70, 640, 22, 22, fill=ACCENT, stroke=ACCENT, sw=0, r=3) + text(104, 659, "20 秒 约 95% 全力", size=21, weight=700)
    b += rect(330, 640, 22, 22, fill=GHOST, stroke=GHOST, sw=0, r=3) + text(364, 659, "10 秒 休息 · 每轮 8 次", size=21, weight=700)
    b += text(70, 712, "器材任选：Assault Bike / 划船机 / 深蹲跳 / 波比跳", size=21, color=FAR, weight=600)
    return frame("Double Tabata", b, "攀岩后换平底鞋 · 两轮 4 分钟 + 中间 2 分钟慢走")


# 12. 出差补丁：慢离心引体 -------------------------------------------------------
def patch():
    b = hangboard(140, 150)
    bot = dict(hand=(260, 182), elbow=(260, 268), shoulder=(260, 352), head=(290, 326), hip=(264, 522), knee=(282, 632), ankle=(266, 730), toe=(288, 736))
    top = dict(hand=(260, 182), elbow=(332, 250), shoulder=(262, 286), head=(296, 226), hip=(258, 456), knee=(276, 566), ankle=(260, 664), toe=(282, 670), r=26)
    b += ghost(bot) + figure(top) + floor(760, 40, 460)
    b += note(484, 620, "宽沿 Jug，双手略宽于肩")
    # 节奏条
    ox, oy = 470, 200
    segs = [("1 秒拉起", 1, INK), ("顶端锁 2 秒", 2, ACCENT), ("4 秒慢放", 4, FAR)]
    b += text(ox, oy - 14, "每一下的节奏", size=22, weight=800)
    yy = oy
    for lab, sec, col in segs:
        b += rect(ox, yy + 10, 40 * sec, 36, fill=col, stroke=col, sw=0, r=6) + text(ox + 40 * sec + 14, yy + 38, lab, size=21, weight=700)
        yy += 60
    b += note(484, 420, "3 组 × 5 次")
    b += note(484, 460, "接着 1 轮 4 分钟 Tabata")
    b += text(484, 520, "接在周五力量日最后，", size=21, weight=600)
    b += text(484, 552, "补回周日没爬的那一天。", size=21, weight=600)
    return frame("出差补丁：慢离心引体", b, "周日去不了岩馆时才用 · 3 × 5 + 1 轮 Tabata")


svgs = {
    "scapular-pullups": scap(), "max-hangs": maxhang(), "goblet-squat": goblet(), "bulgarian-split-squat": bulgarian(),
    "pike-pushup": pike(), "weighted-pushup": weighted(), "cossack-split": cossack(), "no-hangs": nohang(),
    "climbing-warmup": warmup(), "bouldering": boulder(), "double-tabata": tabata(), "travel-patch": patch(),
}

OUT.mkdir(parents=True, exist_ok=True)
for name, svg in svgs.items():
    (OUT / f"{name}.svg").write_text(svg, encoding="utf-8")
print(f"wrote {len(svgs)} svg → {OUT}")
