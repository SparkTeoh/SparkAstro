# 运动清单的动作图解：生成 src/content/stacks/workout/*.svg
# 用法：python3 scripts/workout-figures.py && node scripts/workout-figures-png.mjs
# 风格：浅底 (#f7f6f2) + 黑色解剖线稿 (#0a0a0d) + 站点蓝 (#3d5afe) / 警示红 (#c62828) / 安全绿 (#2e7d32)
import math
import pathlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "src/content/stacks/workout"
INK = "#0a0a0d"
FAR = "#7a7a82"
GHOST = "#b8b8be"
ACCENT = "#3d5afe"
DANGER = "#c62828"
OK = "#2e7d32"
BG = "#f7f6f2"
LINE = "#d9d6cd"
WOOD = "#e8d8b8"
WOOD_DARK = "#cbb58a"
SKIN = "#efe7da"
FONT = "Noto Sans CJK SC, Noto Sans SC, PingFang SC, sans-serif"


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def line(pts, color=INK, w=10, dash=None, cap="round", join="round"):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<polyline points="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="{cap}" stroke-linejoin="{join}"{da}/>'


def poly(pts, fill="none", stroke=INK, w=4, join="round", dash=None):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<polygon points="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="{join}"{da}/>'


def path(d, fill="none", stroke=INK, w=4, cap="round", join="round", dash=None):
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="{cap}" stroke-linejoin="{join}"{da}/>'


def circle(c, r, color=INK, fill=None, w=7, dash=None):
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="{r:.1f}" fill="{fill if fill is not None else BG}" stroke="{color}" stroke-width="{w}"{da}/>'


def rect(x, y, w, h, fill="#fff", stroke=INK, sw=4, r=8, dash=None):
    da = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>'


def text(x, y, s, size=22, color=INK, weight=600, anchor="start"):
    return f'<text x="{x:.1f}" y="{y:.1f}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}">{esc(s)}</text>'


def badge(x, y, w, h, s, bg=ACCENT, fg="#fff", size=18, r=7):
    return (
        rect(x, y, w, h, fill=bg, stroke=bg, sw=0, r=r)
        + text(x + w / 2, y + h / 2 + size * 0.35, s, size=size, color=fg, weight=800, anchor="middle")
    )


def note(x, y, s, anchor="start", color=ACCENT, size=20, weight=700):
    dot = x - 13 if anchor == "start" else (x + 13 if anchor == "end" else None)
    out = text(x, y, s, size=size, color=color, weight=weight, anchor=anchor)
    if dot is not None:
        out = f'<circle cx="{dot:.1f}" cy="{y - size * 0.34:.1f}" r="4.8" fill="{color}"/>' + out
    return out


def arrow(p1, p2, color=ACCENT, w=5, head=15, dash=None):
    ang = math.atan2(p2[1] - p1[1], p2[0] - p1[0])
    a1 = (p2[0] - head * math.cos(ang - 0.48), p2[1] - head * math.sin(ang - 0.48))
    a2 = (p2[0] - head * math.cos(ang + 0.48), p2[1] - head * math.sin(ang + 0.48))
    tip = (p2[0] - head * 0.55 * math.cos(ang), p2[1] - head * 0.55 * math.sin(ang))
    return line([p1, tip], color, w, dash) + f'<polygon points="{p2[0]:.1f},{p2[1]:.1f} {a1[0]:.1f},{a1[1]:.1f} {a2[0]:.1f},{a2[1]:.1f}" fill="{color}"/>'


def arc(c, r, a0, a1, label=None, color=ACCENT, lr=None, size=19, w=3.8):
    """角度弧线，a0→a1 为数学角度（度，0=右，90=上）"""
    def pt(a, rr):
        return (c[0] + rr * math.cos(math.radians(a)), c[1] - rr * math.sin(math.radians(a)))
    s, e = pt(a0, r), pt(a1, r)
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 0 if a1 > a0 else 1
    out = f'<path d="M{s[0]:.1f},{s[1]:.1f} A{r},{r} 0 {large} {sweep} {e[0]:.1f},{e[1]:.1f}" fill="none" stroke="{color}" stroke-width="{w}"/>'
    if label:
        m = pt((a0 + a1) / 2, lr if lr is not None else r + 24)
        out += text(m[0], m[1] + 7, label, size=size, color=color, weight=800, anchor="middle")
    return out


def floor(y, x0=40, x1=760):
    return line([(x0, y), (x1, y)], LINE, 4, cap="butt")


def frame(title, body, cue=None):
    head = (
        text(44, 60, "动作图解 · WORKOUT BIOMECHANICS", size=19, color=ACCENT, weight=800)
        + text(44, 102, title, size=33, weight=900)
    )
    foot = ""
    if cue:
        foot = (
            f'<rect x="0" y="750" width="800" height="50" fill="{INK}"/>'
            + text(400, 782, cue, size=20, color="#fff", weight=700, anchor="middle")
        )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">'
        f'<rect width="800" height="800" fill="{BG}"/>{head}{body}{foot}</svg>'
    )


def side_figure(j, color=INK, far=FAR, dash=None, w=11, head_w=6.5):
    """侧面解剖小人：自动正确连接颈部（从肩膀向上连到头底），绝不让头长在胸口。"""
    out = []
    for a, b in (("far_shoulder", "far_elbow"), ("far_elbow", "far_hand"), ("far_hip", "far_knee"), ("far_knee", "far_ankle"), ("far_ankle", "far_toe")):
        if a in j and b in j:
            out.append(line([j[a], j[b]], far if not dash else color, w - 1, dash))
    if "shoulder" in j and "hip" in j:
        out.append(line([j["shoulder"], j["hip"]], color, w + 4, dash))
    for a, b in (("hip", "knee"), ("knee", "ankle"), ("ankle", "toe"), ("shoulder", "elbow"), ("elbow", "hand")):
        if a in j and b in j:
            out.append(line([j[a], j[b]], color, w, dash))
    if "head" in j and "shoulder" in j:
        (sx, sy), (hx, hy), r = j["shoulder"], j["head"], j.get("r", 24)
        dist = math.hypot(hx - sx, hy - sy)
        if dist > r:
            out.append(line([(sx, sy), (hx - (hx - sx) * r / dist, hy - (hy - sy) * r / dist)], color, w - 2, dash))
        out.append(circle((hx, hy), r, color, fill=BG, w=head_w, dash=dash))
    return "".join(out)


def hangboard_front(cx, y, w=220, active="jug"):
    """门框黄杨木指力板（正面图）：
    active='jug' 高亮顶部宽大平沿；active='pocket20' 高亮中排/下排 20mm 四指平整洞。
    返回 (svg, jug_y, pocket_y)"""
    x = cx - w / 2
    h = 62
    out = []
    # 门框横梁
    out.append(line([(x - 20, y - 8), (x + w + 20, y - 8)], FAR, 4, cap="butt"))
    # 顶部宽沿 Jug 高亮垫
    if active == "jug":
        out.append(rect(x + 12, y - 7, w - 24, 9, fill=ACCENT, stroke=ACCENT, sw=0, r=3))
    # 黄杨木板体
    out.append(rect(x, y, w, h, fill=WOOD, stroke=INK, sw=4, r=10))
    # 上排三孔（圆角浅槽）
    pw = (w - 52) / 3
    for i in range(3):
        px = x + 16 + i * (pw + 10)
        out.append(rect(px, y + 11, pw, 12, fill=WOOD_DARK, stroke=INK, sw=2.5, r=4))
    # 中/下排 20mm 四指平整洞（左右对称两个宽四指洞）
    sw = (w - 48) / 2
    for i in range(2):
        sx = x + 16 + i * (sw + 16)
        fill_c = ACCENT if active == "pocket20" else INK
        stroke_c = ACCENT if active == "pocket20" else INK
        out.append(rect(sx, y + 34, sw, 15, fill=fill_c, stroke=stroke_c, sw=2, r=3))
    return "".join(out), y, y + 42


def grip_cross_section(ox, oy, w, h, kind="half"):
    """指力板 20mm 四指平整洞 · 侧面解剖剖面图（从食指/拇指侧看过去）：
    精准展示指骨（近节/中节/远节）、关节角度（PIP/DIP）、指甲、大拇指位置与滑车韧带（A2）。
    - half: ✓ 半抠 Half Crimp（PIP=90°，DIP=180° 平直，指腹压 20mm 边，大拇指自然放松垂下）
    - open: ✓ 开放握 Open Hand（PIP≈140° 舒展微弯，指腹挂 20mm 边，大拇指放松）
    - full: × 全抠 Full Crimp（PIP<70° 死折，DIP 反折超伸，大拇指死扣食指指甲盖，A2 滑车高危）
    """
    cfg = {
        "half": ("✓ 半抠 Half Crimp", OK, "第二指节 90° · 指尖平直", "大拇指自然放松，不扣指甲"),
        "open": ("✓ 开放握 Open Hand", ACCENT, "指节自然微弯 (≈140°)", "大拇指放松 · 滑车负荷最轻"),
        "full": ("× 严禁：全抠 Full Crimp", DANGER, "指尖关节反折 + 拇指锁指甲", "A2 滑车韧带极易撕裂！"),
    }[kind]
    head_txt, col, cap1, cap2 = cfg

    out = []
    # 卡片外框与顶栏
    out.append(rect(ox, oy, w, h, fill="#fff", stroke=col, sw=4, r=12))
    out.append(path(f"M{ox},{oy+38} V{oy+12} Q{ox},{oy} {ox+12},{oy} H{ox+w-12} Q{ox+w},{oy} {ox+w},{oy+12} V{oy+38} Z", fill=col, stroke=col, w=0))
    out.append(text(ox + w / 2, oy + 26, head_txt, size=18, color="#fff", weight=800, anchor="middle"))

    # 局部坐标系：220 × 195 画布映射到卡片内部
    s = min((w - 16) / 220, (h - 98) / 195)
    dx = ox + (w - 220 * s) / 2
    dy = oy + 42

    def P(px, py):
        return (dx + px * s, dy + py * s)

    # 1. 右侧黄杨木指力板截面（含 20mm 四指平整洞，约 1 个指节深）
    # 板体在右侧 x=128..214, 洞底平台 y=110 (x=128..180，宽 52 对应 20mm 一指节深), 洞后壁 x=180 向上
    board_pts = [P(180, 16), P(214, 16), P(214, 174), P(180, 174), P(180, 140), P(128, 140), P(128, 110), P(180, 110)]
    out.append(poly(board_pts, fill=WOOD, stroke=INK, w=3.2 * s))
    # 20mm 洞深标注（位于木板平台正下方 x=128..180 之间，绝不触碰右侧竖线）
    p_l, p_r = P(130, 154), P(178, 154)
    out.append(line([P(128, 142), P(128, 160)], FAR, 2 * s))
    out.append(line([P(178, 142), P(178, 160)], FAR, 2 * s))
    out.append(line([p_l, p_r], ACCENT if kind != "full" else FAR, 2.5 * s))
    out.append(text((p_l[0] + p_r[0]) / 2, P(154, 171)[1], "20mm", size=max(12, int(13.5 * s)), color=FAR, weight=800, anchor="middle"))

    # 2. 手指与手掌骨骼关键点
    if kind == "half":
        # 半抠：近节严格垂直向上 (x=64) -> PIP 呈标准 90° 直角 -> 中节与远节严格水平向右 (y=88) 压在 20mm 洞底 (y=110)
        wrist = (64, 176)
        mcp = (64, 138)
        pip = (64, 88)       # 第二指节标准 90° 直角顶点
        dip = (126, 88)      # 指尖关节 180° 平直
        tip = (170, 90)      # 指腹稳压在 y=110 洞面上
        finger_d = (
            f"M{P(48,176)[0]:.1f},{P(48,176)[1]:.1f} "
            f"L{P(48,136)[0]:.1f},{P(48,136)[1]:.1f} "
            f"L{P(48,84)[0]:.1f},{P(48,84)[1]:.1f} "
            f"Q{P(48,68)[0]:.1f},{P(48,68)[1]:.1f} {P(66,68)[0]:.1f},{P(66,68)[1]:.1f} "
            f"L{P(128,68)[0]:.1f},{P(128,68)[1]:.1f} "
            f"L{P(168,72)[0]:.1f},{P(168,72)[1]:.1f} "
            f"Q{P(177,76)[0]:.1f},{P(177,76)[1]:.1f} {P(177,94)[0]:.1f},{P(177,94)[1]:.1f} "
            f"Q{P(174,108)[0]:.1f},{P(174,108)[1]:.1f} {P(150,108)[0]:.1f},{P(150,108)[1]:.1f} "
            f"L{P(124,106)[0]:.1f},{P(124,106)[1]:.1f} "
            f"L{P(80,106)[0]:.1f},{P(80,106)[1]:.1f} "
            f"L{P(80,138)[0]:.1f},{P(80,138)[1]:.1f} "
            f"L{P(80,176)[0]:.1f},{P(80,176)[1]:.1f} Z"
        )
        out.append(path(finger_d, fill=SKIN, stroke=INK, w=3.2 * s))
        out.append(path(f"M{P(150,70)[0]:.1f},{P(150,70)[1]:.1f} L{P(171,74)[0]:.1f},{P(171,74)[1]:.1f} Q{P(175,80)[0]:.1f},{P(175,80)[1]:.1f} {P(152,79)[0]:.1f},{P(152,79)[1]:.1f} Z", fill="#fff", stroke=INK, w=2 * s))
        pts_bone = [P(*wrist), P(*mcp), P(*pip), P(*dip), P(*tip)]
        out.append(line(pts_bone, ACCENT, 3.2 * s, dash="5 4"))
        for pt in (mcp, pip, dip):
            out.append(circle(P(*pt), 4.5 * s, ACCENT, fill="#fff", w=2.5 * s))
        # PIP 90° 直角符号与标注
        px, py = P(*pip)
        sq = 15 * s
        out.append(path(f"M{px+sq:.1f},{py:.1f} L{px+sq:.1f},{py+sq:.1f} L{px:.1f},{py+sq:.1f}", fill="none", stroke=OK, w=3 * s))
        out.append(badge(P(12, 28)[0], P(12, 28)[1], 74 * s, 25 * s, "PIP 90°", bg=OK, size=max(12, int(14 * s))))
        out.append(text(P(134, 52)[0], P(134, 52)[1], "DIP 平直", size=max(12, int(13.5 * s)), color=OK, weight=800, anchor="middle"))
        # 大拇指自然放松垂在下方
        thumb_d = (
            f"M{P(68,144)[0]:.1f},{P(68,144)[1]:.1f} "
            f"Q{P(94,136)[0]:.1f},{P(94,136)[1]:.1f} {P(110,146)[0]:.1f},{P(110,146)[1]:.1f} "
            f"Q{P(118,154)[0]:.1f},{P(118,154)[1]:.1f} {P(110,164)[0]:.1f},{P(110,164)[1]:.1f} "
            f"Q{P(94,170)[0]:.1f},{P(94,170)[1]:.1f} {P(66,166)[0]:.1f},{P(66,166)[1]:.1f}"
        )
        out.append(path(thumb_d, fill="#e3d8c4", stroke=INK, w=3 * s))
        out.append(text(P(88, 188)[0], P(88, 188)[1], "✓ 拇指放松", size=max(12, int(13.5 * s)), color=OK, weight=800, anchor="middle"))

    elif kind == "open":
        # 开放握：远节指腹挂住 20mm 洞底，PIP 与 DIP 呈平缓 ~140° 弧线斜向左下
        wrist = (42, 176)
        mcp = (56, 146)
        pip = (84, 108)
        dip = (126, 94)
        tip = (168, 96)
        finger_d = (
            f"M{P(28,176)[0]:.1f},{P(28,176)[1]:.1f} "
            f"L{P(42,140)[0]:.1f},{P(42,140)[1]:.1f} "
            f"Q{P(64,96)[0]:.1f},{P(64,96)[1]:.1f} {P(122,78)[0]:.1f},{P(122,78)[1]:.1f} "
            f"L{P(168,80)[0]:.1f},{P(168,80)[1]:.1f} "
            f"Q{P(176,84)[0]:.1f},{P(176,84)[1]:.1f} {P(175,100)[0]:.1f},{P(175,100)[1]:.1f} "
            f"Q{P(172,112)[0]:.1f},{P(172,112)[1]:.1f} {P(150,112)[0]:.1f},{P(150,112)[1]:.1f} "
            f"L{P(126,111)[0]:.1f},{P(126,111)[1]:.1f} "
            f"Q{P(90,122)[0]:.1f},{P(90,122)[1]:.1f} {P(72,152)[0]:.1f},{P(72,152)[1]:.1f} "
            f"L{P(60,176)[0]:.1f},{P(60,176)[1]:.1f} Z"
        )
        out.append(path(finger_d, fill=SKIN, stroke=INK, w=3.2 * s))
        out.append(path(f"M{P(150,78)[0]:.1f},{P(150,78)[1]:.1f} L{P(170,82)[0]:.1f},{P(170,82)[1]:.1f} Q{P(174,88)[0]:.1f},{P(174,88)[1]:.1f} {P(152,85)[0]:.1f},{P(152,85)[1]:.1f} Z", fill="#fff", stroke=INK, w=2 * s))
        pts_bone = [P(*wrist), P(*mcp), P(*pip), P(*dip), P(*tip)]
        out.append(line(pts_bone, ACCENT, 3.2 * s, dash="5 4"))
        for pt in (mcp, pip, dip):
            out.append(circle(P(*pt), 4.5 * s, ACCENT, fill="#fff", w=2.5 * s))
        out.append(arc(P(*pip), 20 * s, 232, 342, None, color=ACCENT, w=3 * s))
        out.append(badge(P(18, 44)[0], P(18, 44)[1], 88 * s, 25 * s, "PIP ≈140°", bg=ACCENT, size=max(12, int(14 * s))))
        # 大拇指自然放松垂在下方
        thumb_d = (
            f"M{P(58,150)[0]:.1f},{P(58,150)[1]:.1f} "
            f"Q{P(84,142)[0]:.1f},{P(84,142)[1]:.1f} {P(100,152)[0]:.1f},{P(100,152)[1]:.1f} "
            f"Q{P(108,160)[0]:.1f},{P(108,160)[1]:.1f} {P(100,168)[0]:.1f},{P(100,168)[1]:.1f} "
            f"Q{P(84,174)[0]:.1f},{P(84,174)[1]:.1f} {P(56,170)[0]:.1f},{P(56,170)[1]:.1f}"
        )
        out.append(path(thumb_d, fill="#e3d8c4", stroke=INK, w=3 * s))
        out.append(text(P(82, 188)[0], P(82, 188)[1], "✓ 拇指放松", size=max(12, int(13.5 * s)), color=ACCENT, weight=800, anchor="middle"))

    else:
        # 全抠（严禁）：PIP 高高拱起死折 (<70°)，DIP 向下凹陷反折超伸压在洞沿，且大拇指向上死扣在食指指甲盖上！
        wrist = (52, 176)
        mcp = (60, 134)
        pip = (76, 48)       # PIP 高拱死折
        dip = (134, 100)     # DIP 向下压塌反折超伸
        tip = (170, 90)      # 指尖翘起
        finger_d = (
            f"M{P(38,176)[0]:.1f},{P(38,176)[1]:.1f} "
            f"L{P(44,130)[0]:.1f},{P(44,130)[1]:.1f} "
            f"L{P(60,44)[0]:.1f},{P(60,44)[1]:.1f} "
            f"Q{P(66,28)[0]:.1f},{P(66,28)[1]:.1f} {P(86,38)[0]:.1f},{P(86,38)[1]:.1f} "
            f"L{P(134,84)[0]:.1f},{P(134,84)[1]:.1f} "
            f"L{P(168,76)[0]:.1f},{P(168,76)[1]:.1f} "
            f"Q{P(176,78)[0]:.1f},{P(176,78)[1]:.1f} {P(175,96)[0]:.1f},{P(175,96)[1]:.1f} "
            f"Q{P(172,112)[0]:.1f},{P(172,112)[1]:.1f} {P(132,113)[0]:.1f},{P(132,113)[1]:.1f} "
            f"L{P(82,70)[0]:.1f},{P(82,70)[1]:.1f} "
            f"L{P(76,136)[0]:.1f},{P(76,136)[1]:.1f} "
            f"L{P(70,176)[0]:.1f},{P(70,176)[1]:.1f} Z"
        )
        out.append(path(finger_d, fill=SKIN, stroke=INK, w=3.2 * s))
        out.append(path(f"M{P(148,80)[0]:.1f},{P(148,80)[1]:.1f} L{P(170,77)[0]:.1f},{P(170,77)[1]:.1f} Q{P(174,83)[0]:.1f},{P(174,83)[1]:.1f} {P(150,87)[0]:.1f},{P(150,87)[1]:.1f} Z", fill="#fff", stroke=INK, w=2 * s))
        pts_bone = [P(*wrist), P(*mcp), P(*pip), P(*dip), P(*tip)]
        out.append(line(pts_bone, DANGER, 3.2 * s, dash="5 4"))
        for pt in (mcp, pip, dip):
            out.append(circle(P(*pt), 4.5 * s, DANGER, fill="#fff", w=2.5 * s))
        # A2 滑车韧带撕裂高危标注（近节指骨掌侧）
        out.append(line([P(50, 98), P(82, 104)], DANGER, 5 * s))
        out.append(text(P(34, 100)[0], P(34, 100)[1], "A2!", size=max(12, int(13.5 * s)), color=DANGER, weight=900, anchor="end"))
        # 大拇指向上伸出，死死扣压在食指指甲盖上！
        thumb_lock_d = (
            f"M{P(66,142)[0]:.1f},{P(66,142)[1]:.1f} "
            f"Q{P(100,116)[0]:.1f},{P(100,116)[1]:.1f} {P(138,68)[0]:.1f},{P(138,68)[1]:.1f} "
            f"Q{P(156,52)[0]:.1f},{P(156,52)[1]:.1f} {P(172,64)[0]:.1f},{P(172,64)[1]:.1f} "
            f"Q{P(176,76)[0]:.1f},{P(176,76)[1]:.1f} {P(154,80)[0]:.1f},{P(154,80)[1]:.1f} "
            f"Q{P(132,92)[0]:.1f},{P(132,92)[1]:.1f} {P(84,158)[0]:.1f},{P(84,158)[1]:.1f}"
        )
        out.append(path(thumb_lock_d, fill="#dfcfb4", stroke=DANGER, w=3.2 * s))
        out.append(circle(P(158, 70), 19 * s, DANGER, fill="none", w=3.2 * s, dash="4 3"))
        out.append(badge(P(112, 16)[0], P(112, 16)[1], 96 * s, 23 * s, "× 拇指压指甲", bg=DANGER, size=max(11, int(12.5 * s))))
        out.append(text(P(84, 188)[0], P(84, 188)[1], "× 指尖反折", size=max(12, int(13.5 * s)), color=DANGER, weight=800, anchor="middle"))

    # 卡片底部两行说明
    out.append(text(ox + w / 2, oy + h - 30, cap1, size=16.5, color=INK, weight=700, anchor="middle"))
    out.append(text(ox + w / 2, oy + h - 10, cap2, size=16, color=col, weight=800, anchor="middle"))
    return "".join(out)


def dumbbell(c, vertical=True, size=1.0):
    x, y = c
    L, pw, ph = 52 * size, 40 * size, 14 * size
    if vertical:
        return (
            line([(x, y - L / 2), (x, y + L / 2)], INK, 7 * size)
            + rect(x - pw / 2, y - L / 2 - ph, pw, ph, fill=INK, sw=0, r=4)
            + rect(x - pw / 2, y + L / 2, pw, ph, fill=INK, sw=0, r=4)
        )
    return (
        line([(x - L / 2, y), (x + L / 2, y)], INK, 7 * size)
        + rect(x - L / 2 - ph, y - pw / 2, ph, pw, fill=INK, sw=0, r=4)
        + rect(x + L / 2, y - pw / 2, ph, pw, fill=INK, sw=0, r=4)
    )


# ==============================================================================
# 1. 肩胛骨激活引体（Scapular Pull-Ups）—— 背面双图对比，清晰展示肩胛骨沉降与身体上移
# ==============================================================================
def scap():
    out = []

    def back_climber(cx, dy, active=False):
        """背面攀岩者：cx 为中心 x，dy 为身体整体上移像素（active=True 时上移 22px 对应 3-5cm）"""
        hb, jug_y, _ = hangboard_front(cx, 166, w=210, active="jug")
        o = [hb]
        # 双手抓握指力板最上方宽大平沿 (Jug: y = jug_y)
        lh, rh = (cx - 66, jug_y + 2), (cx + 66, jug_y + 2)
        # 放松悬垂时肩膀被动靠近耳朵 (sy=338, head_y=302)；激活时肩胛下沉、脖子拉长且身体整体上移 dy=22
        sy = 336 - dy
        ls, rs = (cx - 48, sy), (cx + 48, sy)
        le, re = (cx - 57, (jug_y + sy) / 2), (cx + 57, (jug_y + sy) / 2)
        head_y = (264 if active else 298)  # 激活时头随身体上移且肩膀远离耳朵！
        hip_y = 486 - dy
        knee_y = 594 - dy
        ank_y = 690 - dy

        # 双臂完全伸直 (180°)
        o.append(line([lh, le, ls], INK, 10))
        o.append(line([rh, re, rs], INK, 10))
        o.append(circle(lh, 6, ACCENT if active else INK, fill=ACCENT if active else INK, w=2))
        o.append(circle(rh, 6, ACCENT if active else INK, fill=ACCENT if active else INK, w=2))

        # 躯干倒梯形背阔肌轮廓
        torso_pts = [(ls[0], ls[1]), (rs[0], rs[1]), (cx + 25, hip_y), (cx - 25, hip_y)]
        o.append(poly(torso_pts, fill="#fff", stroke=INK, w=8))
        o.append(line([(cx, sy + 6), (cx, hip_y)], LINE, 3, dash="5 5"))

        # 左右两片三角形肩胛骨（核心教学点！）
        if not active:
            l_scap = [(cx - 42, sy + 10), (cx - 15, sy + 16), (cx - 24, sy + 60)]
            r_scap = [(cx + 42, sy + 10), (cx + 15, sy + 16), (cx + 24, sy + 60)]
            o.append(poly(l_scap, fill=BG, stroke=DANGER, w=3.5))
            o.append(poly(r_scap, fill=BG, stroke=DANGER, w=3.5))
            o.append(arrow((cx - 64, sy + 18), (cx - 64, sy - 14), color=DANGER, w=4, head=11))
            o.append(arrow((cx + 64, sy + 18), (cx + 64, sy - 14), color=DANGER, w=4, head=11))
        else:
            l_scap = [(cx - 35, sy + 26), (cx - 10, sy + 30), (cx - 14, sy + 76)]
            r_scap = [(cx + 35, sy + 26), (cx + 10, sy + 30), (cx + 14, sy + 76)]
            o.append(poly(l_scap, fill="#dce3ff", stroke=ACCENT, w=4))
            o.append(poly(r_scap, fill="#dce3ff", stroke=ACCENT, w=4))
            o.append(arrow((cx - 36, sy + 14), (cx - 15, sy + 54), color=ACCENT, w=4.5, head=12))
            o.append(arrow((cx + 36, sy + 14), (cx + 15, sy + 54), color=ACCENT, w=4.5, head=12))

        # 颈部与头部（头部在指力板下方，绝不与指力板重叠）
        o.append(line([(cx, sy), (cx, head_y + 22)], INK, 9))
        o.append(circle((cx, head_y), 23, INK, fill="#fff", w=6.5))

        # 双腿悬垂离地
        o.append(line([(cx - 15, hip_y), (cx - 17, knee_y), (cx - 17, ank_y)], INK, 10))
        o.append(line([(cx + 15, hip_y), (cx + 17, knee_y), (cx + 17, ank_y)], INK, 10))
        return "".join(o), head_y, hip_y, ank_y

    # 左侧 cx=164，右侧 cx=456，给最右侧留足文字空间 (x=576..780)
    left_svg, h1, hip1, a1 = back_climber(164, 0, active=False)
    right_svg, h2, hip2, a2 = back_climber(456, 22, active=True)
    out.append(left_svg)
    out.append(right_svg)
    out.append(floor(732))

    # 顶部步骤胶囊（位于门框横梁上方，不重叠）
    out.append(badge(52, 118, 224, 28, "① 起始：抓顶部宽沿悬垂", bg=FAR, size=16.5))
    out.append(badge(336, 118, 240, 28, "② 激活：肩胛下沉锁死 3 秒", bg=ACCENT, size=16.5))

    # 高度对比基准虚线（直观看到身体整体被拉起 3–5 cm）
    out.append(line([(125, hip1), (535, hip1)], FAR, 2.5, dash="6 6"))
    out.append(line([(415, hip2), (535, hip2)], ACCENT, 2.5, dash="6 6"))
    out.append(arrow((310, hip1), (310, hip2), color=ACCENT, w=5, head=13))
    out.append(badge(250, 422, 120, 28, "上移 3–5 cm", bg=ACCENT, size=16.5))

    # 关键动作标注（右侧 x=582，全部在 800 画布内）
    out.append(text(164, 418, "被动耸肩（勿死挂）", size=17.5, color=DANGER, weight=700, anchor="middle"))
    out.append(note(582, 244, "抓最上方宽沿 (Jug)", size=18.5))
    out.append(note(582, 288, "双臂 180° 完全伸直", size=18.5))
    out.append(text(582, 314, "严禁屈肘借力拉起", size=16.5, color=DANGER, weight=700))
    out.append(note(582, 362, "肩胛骨向后下方沉降", size=18.5))
    out.append(note(582, 404, "顶端死死锁住 3 秒", size=18.5))
    out.append(text(582, 432, "加固肩关节盂唇稳定性", size=16.5, color=FAR, weight=700))

    return frame("肩胛骨激活引体（Scapular Pull-Ups）", "".join(out), "100% 自重 (73kg) · 2 组 × 8 次 · 组间休息 30 秒 · 背面视角")


# ==============================================================================
# 2. 双脚离地最大悬垂（Max Hangs）—— 3 种握姿侧面解剖对比 + 全身悬垂/点地减重示意
# ==============================================================================
def maxhang():
    out = []
    # 上半部分：三种握姿侧面解剖剖面对比（20mm 四指平整洞，约一个指节深）
    out.append(grip_cross_section(38, 120, 232, 316, "half"))
    out.append(grip_cross_section(284, 120, 232, 316, "open"))
    out.append(grip_cross_section(530, 120, 232, 316, "full"))

    # 下半部分：门框黄杨木指力板（高亮中排/下排 20mm 四指洞）+ 正面悬垂姿态 + 单脚点地卸力
    out.append(rect(38, 450, 724, 284, fill="#fff", stroke=INK, sw=3, r=14))
    cx = 162
    hb, _, p20_y = hangboard_front(cx, 468, w=186, active="pocket20")
    out.append(hb)

    # 双手抓 20mm 四指洞，手肘极微屈 170°（不死锁 180°），双肩下沉
    lh, rh = (cx - 44, p20_y), (cx + 44, p20_y)
    le, re = (cx - 52, 548), (cx + 52, 548)
    ls, rs = (cx - 38, 584), (cx + 38, 584)
    hip_y = 648

    out.append(line([lh, le, ls], INK, 8.5))
    out.append(line([rh, re, rs], INK, 8.5))
    out.append(arc(re, 20, 100, 250, None, color=ACCENT, w=3))
    out.append(text(re[0] + 14, re[1] + 4, "肘 170°", size=15.5, color=ACCENT, weight=800))
    out.append(arrow((ls[0] - 16, ls[1] - 14), (ls[0] - 16, ls[1] + 14), color=ACCENT, w=4, head=10))
    out.append(text(ls[0] - 22, ls[1] + 5, "沉肩", size=15.5, color=ACCENT, weight=800, anchor="end"))

    # 躯干与头部
    out.append(poly([ls, rs, (cx + 20, hip_y), (cx - 20, hip_y)], fill=BG, stroke=INK, w=6.5))
    out.append(line([(cx, 584), (cx, 562)], INK, 7))
    out.append(circle((cx, 544), 17, INK, fill="#fff", w=5.5))

    # 双腿完全离地（实线）+ 单脚脚尖轻点地卸力 5-10kg（蓝色虚线）
    out.append(line([(cx - 13, hip_y), (cx - 15, 684), (cx - 15, 704), (cx - 26, 708)], INK, 8))
    out.append(line([(cx + 13, hip_y), (cx + 15, 684), (cx + 15, 704), (cx + 26, 708)], INK, 8))
    out.append(line([(cx + 13, hip_y), (cx + 46, 690), (cx + 60, 720)], ACCENT, 5.5, dash="6 5"))
    out.append(circle((cx + 60, 720), 4.5, ACCENT, fill=ACCENT, w=1))
    out.append(line([(54, 722), (324, 722)], LINE, 3.5))
    out.append(text(cx - 18, 718, "双脚离地", size=14.5, color=INK, weight=800, anchor="end"))
    out.append(text(cx + 68, 718, "点地卸力(-5~10kg)", size=14.5, color=ACCENT, weight=800))

    # 下半部分右侧：核心执行参数与禁忌（rx=356，完全控制在 748 以内）
    rx = 356
    out.append(text(rx, 486, "主项执行铁律（选用中/下排 20mm 四指洞）", size=20, color=INK, weight=900))
    out.append(badge(rx, 500, 128, 32, "7 秒全力悬垂", bg=ACCENT, size=16))
    out.append(badge(rx + 134, 500, 250, 32, "113 秒落地彻底休息（凑足 2 分钟）", bg=INK, size=15.5))
    out.append(note(rx + 12, 562, "握姿：严守「半抠 90°」或「开放握」，拇指放松", size=17.5))
    out.append(note(rx + 12, 594, "肩肘：双肩下沉、手肘微屈 170°（严禁耸肩硬挂）", size=17.5))
    out.append(note(rx + 12, 626, "呼吸：7 秒全程缓慢吐气（严禁憋气，防血压冲高）", size=17.5))
    out.append(note(rx + 12, 658, "减重：撑不满 7 秒用单脚尖点地，绝不改全抠！", color=DANGER, size=17.5))
    out.append(text(rx, 700, "容量：连续 4 组 × 2 分钟（总耗时约 8 分钟）", size=17, color=FAR, weight=700))

    return frame("双脚离地最大悬垂（Max Hangs）", "".join(out), "100% 自重 (73kg) · 【7 秒全力悬垂 + 113 秒休息】× 4 组 · 20mm 四指洞")


# ==============================================================================
# 3. 大重量高脚杯全蹲（Heavy Goblet Deep Squat）
# ==============================================================================
def goblet():
    out = []
    # 站立虚影直接位于下蹲小人正上方（同一双脚位置！）
    up = dict(
        head=(348, 178), shoulder=(344, 232), hip=(336, 396),
        knee=(346, 540), ankle=(344, 686), toe=(394, 692),
        elbow=(374, 308), hand=(384, 256), r=24
    )
    # 底部全蹲到底（大腿后侧完全贴靠小腿，脊柱中立不眨眼，哑铃紧捧于锁骨下方）
    down = dict(
        head=(364, 368), shoulder=(352, 424), far_shoulder=(346, 424),
        hip=(270, 610), far_hip=(264, 608),
        knee=(402, 574), far_knee=(392, 570),
        ankle=(344, 686), far_ankle=(336, 686),
        toe=(394, 692), far_toe=(386, 692),
        elbow=(390, 520), hand=(404, 466), r=24
    )
    out.append(side_figure(up, color=GHOST, dash="9 8", w=8))
    out.append(floor(700, 60, 740))
    out.append(side_figure(down))
    out.append(dumbbell((412, 458), vertical=True, size=0.95))

    # 脊柱与股骨颈轴向加压示意线
    out.append(line([(352, 424), (270, 610)], ACCENT, 4, dash="6 5"))
    out.append(arrow((308, 195), (308, 340), color=ACCENT, w=5))

    # 左侧节奏标注（上下分层排布，绝不穿过箭头线）
    out.append(arrow((226, 230), (226, 440), color=ACCENT, w=5))
    out.append(note(206, 316, "3 秒慢速下蹲", anchor="end"))
    out.append(text(206, 346, "控制离心到底", size=18, color=FAR, weight=700, anchor="end"))

    out.append(arrow((226, 660), (226, 470), color=INK, w=5))
    out.append(note(206, 556, "1 秒爆发站起", anchor="end", color=INK))
    out.append(text(206, 586, "推地同时呼气", size=18, color=INK, weight=700, anchor="end"))

    # 右侧动作细节
    out.append(note(468, 444, "哑铃紧捧于胸前锁骨下"))
    out.append(note(468, 484, "脊柱与股骨颈轴向加压"))
    out.append(note(468, 586, "全蹲到底：大腿后侧贴小腿"))
    out.append(note(468, 626, "底停 1 秒：核心与盆底肌紧绷"))
    out.append(text(468, 658, "严禁底部放松弹震或「屁股眨眼」", size=18.5, color=DANGER, weight=700))

    # 右上角：俯视双脚（脚跟在后、脚尖外展 30° 朝前外方）
    ox, oy = 508, 142
    out.append(rect(ox, oy, 248, 218, fill="#fff", stroke=INK, sw=3, r=14))
    out.append(text(ox + 124, oy + 30, "俯视站距：略宽于肩", size=18.5, color=FAR, weight=700, anchor="middle"))
    for sgn in (-1, 1):
        cx, cy = ox + 124 + sgn * 52, oy + 150
        ang = sgn * 30
        out.append(line([(cx, cy), (cx, cy - 82)], ACCENT, 2.5, dash="5 5"))
        out.append(
            f'<g transform="translate({cx},{cy}) rotate({ang})">'
            f'<rect x="-14" y="-74" width="28" height="76" rx="14" fill="{INK}"/>'
            f'<line x1="-10" y1="-52" x2="10" y2="-52" stroke="#fff" stroke-width="3"/>'
            f'</g>'
        )
        out.append(arc((cx, cy), 44, 90, 90 - sgn * 30, None, color=ACCENT, w=3.5))
    out.append(text(ox + 124, oy + 198, "脚尖外展 30°（膝盖对脚尖）", size=18, color=ACCENT, weight=800, anchor="middle"))

    return frame("大重量高脚杯全蹲（Goblet Squat）", "".join(out), "单只哑铃 20–24 kg 起（进阶 28–32 kg）· 4 组 × 6–8 次 · 组间休息 120 秒")


# ==============================================================================
# 4. 哑铃保加利亚分腿蹲（Dumbbell Bulgarian Split Squat）
# ==============================================================================
def bulgarian():
    out = []
    # 整体左移 46px，让右侧文字拥有充裕空间；手部下移至大腿下方提哑铃，绝不与大腿重叠
    out.append(rect(54, 548, 168, 26, fill="#fff", stroke=INK, sw=4, r=6))
    out.append(line([(74, 574), (74, 696)], INK, 8))
    out.append(line([(202, 574), (202, 696)], INK, 8))
    out.append(floor(700, 40, 760))

    hip = (374, 536)
    sh = (410, 372)
    head = (422, 322)
    f_knee = (496, 548)
    f_ank = (488, 688)
    f_toe = (540, 694)
    b_knee = (330, 676)
    b_ank = (208, 546)
    b_toe = (158, 546)  # 后脚脚背平搭在凳面上
    elbow = (406, 468)
    hand = (402, 584)   # 手位于大腿下方，哑铃自然悬垂在侧面下方

    # 后腿（深灰）
    out.append(line([hip, b_knee, b_ank, b_toe], FAR, 11))
    # 前腿与躯干（黑色）
    j = dict(hip=hip, shoulder=sh, head=head, knee=f_knee, ankle=f_ank, toe=f_toe, elbow=elbow, hand=hand, r=24)
    out.append(side_figure(j))
    out.append(dumbbell((402, 602), vertical=False, size=0.82))

    # 躯干微前倾 15° 角度标注
    out.append(line([hip, (hip[0], 336)], ACCENT, 3, dash="6 6"))
    out.append(arc(hip, 128, 90, 72, "15°", lr=154, size=21))

    # 后膝离地 2cm 标注
    out.append(line([(330, 682), (330, 700)], DANGER, 4))
    out.append(badge(240, 706, 180, 30, "后膝离地 2 cm 停 1 秒", bg=DANGER, size=16.5))

    # 其余标注（全部在 x < 765 内）
    out.append(note(146, 518, "凳高约 40 cm（后脚脚背搭凳）", anchor="middle", size=19))
    out.append(arrow((454, 410), (454, 514), color=ACCENT, w=5))
    out.append(note(478, 380, "躯干微前倾 15°（强化臀腿后链）", size=19.5))
    out.append(note(478, 428, "双手自然下垂各提 10–14 kg 哑铃", size=19.5))
    out.append(note(478, 476, "3 秒极慢控制下蹲 · 底停 1 秒", size=19.5))
    out.append(arrow((522, 674), (522, 588), color=INK, w=5))
    out.append(note(544, 628, "前脚后跟发力推起", color=INK, size=19.5))
    out.append(text(544, 658, "加固单腿稳定与 ACL / 跟腱装甲", size=17.5, color=FAR, weight=700))

    return frame("哑铃保加利亚分腿蹲（Bulgarian Split Squat）", "".join(out), "双手各 10–14 kg（总 20–28 kg）· 每侧 3 组 × 8 次 · 左右连做 · 组休 90 秒")


# ==============================================================================
# 5. 支架垫高折刀俯卧撑 / 靠墙倒立撑（Parallettes Pike Push-Up / HSPU）
# ==============================================================================
def pike():
    out = []
    # 40-50cm 椅子 + 俯卧撑支架 Parallettes
    out.append(rect(76, 466, 160, 26, fill="#fff", stroke=INK, sw=4, r=6))
    out.append(line([(96, 492), (96, 690)], INK, 8))
    out.append(line([(216, 492), (216, 690)], INK, 8))
    out.append(line([(466, 638), (466, 690)], INK, 7))
    out.append(line([(546, 638), (546, 690)], INK, 7))
    out.append(line([(454, 634), (558, 634)], INK, 11))
    out.append(floor(694, 50, 750))

    # 起始直臂倒 V 虚影
    top_j = dict(
        hand=(506, 630), elbow=(496, 538), shoulder=(484, 446),
        hip=(370, 286), knee=(288, 376), ankle=(206, 462), toe=(190, 438),
        head=(516, 486), r=23
    )
    # 底部三脚架实线（大臂向身体前方内收 45°，头顶落于双手连线前方！）
    bot_j = dict(
        hand=(506, 630), elbow=(486, 558), shoulder=(532, 514),
        hip=(386, 314), knee=(296, 388), ankle=(206, 462), toe=(190, 438),
        head=(566, 578), r=23
    )
    out.append(side_figure(top_j, color=GHOST, dash="9 8", w=8))
    out.append(side_figure(bot_j))

    # 倒 V 与动作标注
    out.append(arc((386, 314), 38, 218, 310, "倒 V", lr=-26))
    out.append(note(330, 248, "全程收紧腹臀，防止「香蕉腰」塌陷", anchor="middle"))
    out.append(note(156, 730, "椅高 40–50 cm", anchor="middle"))
    out.append(arrow((606, 466), (606, 576), color=ACCENT, w=5))
    out.append(note(626, 495, "3 秒慢放吸气", size=19.5))
    out.append(note(626, 535, "头顶落于双手前方", size=19.5))
    out.append(note(626, 585, "1 秒爆发推起呼气", color=INK, size=19.5))
    out.append(note(580, 646, "手腕 180° 绝对直腕", size=19.5))
    out.append(note(580, 682, "大臂内收 45°（不外翻）", size=19.5))

    # 右上角面板 1：俯视等边三角形（三脚架结构）
    ox, oy = 524, 132
    out.append(rect(ox, oy, 236, 176, fill="#fff", stroke=INK, sw=3, r=12))
    out.append(text(ox + 118, oy + 26, "俯视：三脚架等边三角形", size=17, color=FAR, weight=800, anchor="middle"))
    h1, h2, hd = (ox + 62, oy + 132), (ox + 174, oy + 132), (ox + 118, oy + 56)
    out.append(poly([h1, h2, hd], fill="#eef1ff", stroke=ACCENT, w=3, dash="6 4"))
    out.append(line([(h1[0] - 8, h1[1] + 16), (h1[0] + 8, h1[1] - 16)], INK, 7))
    out.append(line([(h2[0] - 8, h2[1] - 16), (h2[0] + 8, h2[1] + 16)], INK, 7))
    out.append(circle(h1, 9, INK, fill=INK, w=2))
    out.append(circle(h2, 9, INK, fill=INK, w=2))
    out.append(circle(hd, 16, ACCENT, fill="#fff", w=4.5))
    out.append(text(hd[0], hd[1] + 5, "头", size=14, color=ACCENT, weight=800, anchor="middle"))
    out.append(text(ox + 118, oy + 162, "头顶前侧落于双手连线前方", size=16, color=ACCENT, weight=800, anchor="middle"))

    # 右上角面板 2：进阶靠墙倒立撑提示
    out.append(rect(524, 322, 236, 108, fill="#fff", stroke=ACCENT, sw=3, r=12))
    out.append(badge(538, 334, 208, 26, "进阶：靠墙倒立撑 (HSPU)", bg=ACCENT, size=16))
    out.append(text(642, 384, "折刀式能标准完成 8 次后进阶", size=16, color=INK, weight=700, anchor="middle"))
    out.append(text(642, 410, "单组倒立滞留严禁超过 45 秒！", size=16, color=DANGER, weight=800, anchor="middle"))

    return frame("支架垫高折刀俯卧撑 / 靠墙倒立撑", "".join(out), "自重 (73kg) · 4 组 × 6–8 次 · 组间休息 90 秒 · 单组倒立 ≤ 45 秒")


# ==============================================================================
# 6. 支架负重俯卧撑 / 地板哑铃卧推（Weighted Push-Up / Floor Press）
# ==============================================================================
def weighted():
    out = []
    # 上半部分：侧面展示「3 秒慢放至胸触支架水平面（虚线）」与「1 秒推起至顶端肩胛前推拱背（实线）」
    out.append(line([(556, 344), (556, 386)], INK, 7))
    out.append(line([(624, 344), (624, 386)], INK, 7))
    out.append(line([(544, 340), (636, 340)], INK, 11))
    out.append(floor(390, 50, 750))

    bot = dict(
        toe=(108, 384), ankle=(126, 368), knee=(238, 352), hip=(356, 336),
        shoulder=(576, 318), elbow=(532, 286), hand=(590, 336), head=(626, 308), r=22
    )
    top = dict(
        toe=(108, 384), ankle=(126, 368), knee=(238, 334), hip=(356, 298),
        shoulder=(586, 232), elbow=(588, 284), hand=(590, 336), head=(632, 222), r=22
    )
    out.append(side_figure(bot, color=GHOST, dash="8 7", w=7.5))
    out.append(side_figure(top, w=10))
    out.append(path("M520,250 Q558,216 592,232", fill="none", stroke=ACCENT, w=5))
    out.append(arrow((560, 266), (560, 224), color=ACCENT, w=4.5, head=12))

    # 背负 10-15kg 双肩包（放置在背中部，不遮挡左上方文字）
    out.append('<g transform="translate(476,250) rotate(-17)">' + rect(-44, -30, 88, 26, fill=ACCENT, stroke=INK, sw=3, r=6) + text(0, -11, "10–15 kg", size=15.5, color="#fff", weight=800, anchor="middle") + "</g>")

    out.append(note(64, 168, "3 秒慢放至胸部轻触支架水平面", size=19.5))
    out.append(note(64, 204, "1 秒推起至顶端：肩胛骨主动前推拱背", size=19.5))
    out.append(text(64, 234, "强力激活前锯肌，抵消攀岩含胸内扣", size=17.5, color=FAR, weight=700))

    # 下半部分：俯视对比（✓ 45° 箭头夹角 vs × 90° T 字架肘）
    def top_panel(ox, oy, deg, ok):
        col = OK if ok else DANGER
        o = [rect(ox, oy, 336, 310, fill="#fff", stroke=col, sw=3.5, r=14)]
        o.append(text(ox + 24, oy + 34, "正上方俯视", size=18, color=FAR, weight=700))
        cx, sy = ox + 168, oy + 106
        o.append(rect(cx - 24, sy, 48, 126, fill=INK, stroke=INK, sw=0, r=20))
        o.append(circle((cx, sy - 34), 22, INK, fill="#fff", w=6))
        for sgn in (-1, 1):
            a = math.radians(deg)
            sh = (cx + sgn * 24, sy + 14)
            el = (sh[0] + sgn * 88 * math.sin(a), sh[1] + 88 * math.cos(a))
            o.append(line([(el[0] - sgn * 10, el[1] - 28), (el[0] - sgn * 10, el[1] + 10)], FAR, 6))
            o.append(line([sh, el], INK, 13))
            o.append(line([sh, (sh[0], sh[1] + 88)], col, 2.8, dash="6 5"))
            o.append(arc(sh, 50, -90, -90 + sgn * deg, f"{deg}°", color=col, lr=68, size=18))
        label = "✓ 正确：大臂与躯干呈 45° 箭头" if ok else "× 严禁：90° T 字架肘（伤肩峰）"
        o.append(badge(ox + 18, oy + 262, 300, 34, label, bg=col, size=17))
        return "".join(o)

    out.append(top_panel(46, 418, 45, True))
    out.append(top_panel(418, 418, 90, False))

    return frame("支架负重俯卧撑 / 地板哑铃卧推", "".join(out), "背负 10–15 kg 俯卧撑（或双手各 18–22 kg 地板卧推）· 4 组 × 8–10 次 · 休 90 秒")


# ==============================================================================
# 7. 功能性横叉转化（Loaded Cossack Squat + PNF Side Split）
# ==============================================================================
def cossack():
    out = []
    # ① 上半部分：负重哥萨克蹲（正视，真正蹲到底：髋部贴近弯曲侧脚踝，直腿脚跟着地脚尖朝天）
    out.append(badge(44, 122, 376, 30, "① 负重哥萨克蹲：2 组 × 每侧 6 次（动态开胯）", bg=ACCENT, size=16.5))
    out.append(floor(426, 44, 756))

    hip = (276, 370)
    sh = (284, 234)
    head = (284, 190)
    l_knee = (196, 320)
    l_ank = (214, 418)
    l_toe = (174, 420)
    r_ank = (556, 418)
    r_toe = (566, 372)

    out.append(line([hip, l_knee, l_ank, l_toe], INK, 11))
    out.append(line([hip, r_ank, r_toe], INK, 11))
    out.append(line([sh, hip], INK, 15))
    out.append(circle(head, 22, INK, fill=BG, w=6.5))
    out.append(line([(272, 244), (246, 300), (278, 288)], INK, 9))
    out.append(line([(296, 244), (322, 300), (290, 288)], INK, 9))
    out.append(dumbbell((284, 282), vertical=True, size=0.72))

    out.append(note(356, 226, "胸前捧 8–12 kg 哑铃"))
    out.append(note(356, 264, "左右交替侧弓步深蹲到底"))
    out.append(note(68, 280, "蹲侧：全脚掌踩实"))
    out.append(text(68, 308, "膝盖严格对齐脚尖", size=17.5, color=FAR, weight=700))
    out.append(arrow((566, 360), (566, 320), color=ACCENT, w=4.5, head=12))
    out.append(note(586, 346, "直腿侧：脚跟着地"))
    out.append(text(586, 374, "脚尖朝天（拉伸内收肌）", size=17.5, color=ACCENT, weight=700))

    # ② 下半部分：地面一字马横叉 PNF 等长收缩循环（3 轮）—— 左右分栏无重叠
    out.append(badge(44, 446, 396, 30, "② 无缝进入地面横叉 PNF 循环：连续重复 3 轮", bg=INK, size=16.5))
    out.append(floor(720, 44, 756))

    s_hip = (390, 646)
    s_sh = (390, 542)
    s_head = (390, 504)  # 位于黑底胶囊 (y=446..476) 正下方，绝不重叠！
    out.append(line([s_hip, (146, 712), (136, 676)], INK, 11))
    out.append(line([s_hip, (634, 712), (644, 676)], INK, 11))
    out.append(line([s_sh, s_hip], INK, 15))
    out.append(circle(s_head, 20, INK, fill=BG, w=6))
    out.append(line([(376, 554), (334, 622), (334, 714)], FAR, 8))
    out.append(line([(404, 554), (446, 622), (446, 714)], FAR, 8))

    # PNF 第一阶段：双脚脚跟主动向下、向内死命夹地 10 秒
    out.append(arrow((126, 650), (182, 704), color=DANGER, w=5, head=13))
    out.append(arrow((240, 736), (170, 718), color=DANGER, w=5, head=13))
    out.append(arrow((654, 650), (598, 704), color=DANGER, w=5, head=13))
    out.append(arrow((540, 736), (610, 718), color=DANGER, w=5, head=13))

    # PNF 第二阶段：放松深呼气，骨盆下沉 20 秒
    out.append(arrow((390, 588), (390, 636), color=ACCENT, w=5, head=13))

    # 左右两侧卡片化标注，避开中央人形躯干 (x=320..460)
    out.append(note(58, 526, "阶段 A（10 秒）：", color=DANGER, size=18.5))
    out.append(text(58, 554, "双脚跟向下、向内死命夹地", size=17.5, color=DANGER, weight=800))
    out.append(text(58, 580, "内收肌等长收缩，保护髋韧带", size=16.5, color=INK, weight=600))

    out.append(note(486, 526, "阶段 B（20 秒）：", color=ACCENT, size=18.5))
    out.append(text(486, 554, "彻底放松并深呼气", size=17.5, color=ACCENT, weight=800))
    out.append(text(486, 580, "解除防御，让骨盆自然下沉", size=16.5, color=INK, weight=600))

    return frame("功能性横叉转化（Cossack Squat + PNF Split）", "".join(out), "哥萨克蹲 8–12 kg × 2 组 × 每侧 6 次 → 横叉 PNF【夹地 10 秒 + 放松下沉 20 秒】× 3 轮")


# ==============================================================================
# 8. 双脚踩地减重悬垂（No-Hangs）—— 双手分别抓左右 20mm 洞 + 双脚全脚掌踩地微屈膝 + 海绵挤压效应
# ==============================================================================
def nohang():
    out = []
    # 左侧：门框黄杨木指力板（高亮左右两个 20mm 四指洞）+ 正面/微侧屈膝下沉挂重（双手分别抓左右两个 20mm 洞，绝不穿头！）
    cx = 178
    hb, _, p20_y = hangboard_front(cx, 148, w=210, active="pocket20")
    out.append(hb)
    out.append(floor(720, 40, 430))

    lh, rh = (cx - 48, p20_y), (cx + 48, p20_y)

    # ① 20 秒站直放松虚影（背景）
    out.append(line([lh, (cx - 42, 316)], GHOST, 7.5, dash="8 6"))
    out.append(line([rh, (cx + 42, 316)], GHOST, 7.5, dash="8 6"))
    out.append(circle((cx, 266), 20, GHOST, fill="none", w=5.5, dash="8 6"))
    out.append(line([(cx - 18, 470), (cx - 18, 708)], GHOST, 7.5, dash="8 6"))
    out.append(line([(cx + 18, 470), (cx + 18, 708)], GHOST, 7.5, dash="8 6"))

    # ② 10 秒微屈膝下沉挂重实线（前景：双手抓 20mm 洞，沉肩，身体微屈膝下沉把 30-35kg 交给手指，双脚踩实地面）
    ls, rs = (cx - 42, 348), (cx + 42, 348)
    le, re = (cx - 50, 272), (cx + 50, 272)
    hip_y = 508
    out.append(line([lh, le, ls], INK, 9.5))
    out.append(line([rh, re, rs], INK, 9.5))
    out.append(circle(lh, 5.5, ACCENT, fill=ACCENT, w=2))
    out.append(circle(rh, 5.5, ACCENT, fill=ACCENT, w=2))
    out.append(poly([ls, rs, (cx + 24, hip_y), (cx - 24, hip_y)], fill="#fff", stroke=INK, w=7.5))
    out.append(line([(cx, 348), (cx, 322)], INK, 8))
    out.append(circle((cx, 300), 21, INK, fill="#fff", w=6.5))

    # 双腿微屈膝下沉，双脚全脚掌踩实地面绿色垫
    out.append(line([(cx - 16, hip_y), (cx - 34, 608), (cx - 20, 706), (cx - 42, 710)], INK, 10))
    out.append(line([(cx + 16, hip_y), (cx + 34, 608), (cx + 20, 706), (cx + 42, 710)], INK, 10))

    # 臀部微屈膝下沉箭头
    out.append(arrow((88, 420), (88, 520), color=ACCENT, w=5))
    out.append(note(74, 408, "微屈膝", anchor="end", size=19))
    out.append(note(74, 442, "下沉挂重", anchor="end", size=19))

    # 双脚踩实地面高亮
    out.append(rect(cx - 52, 706, 104, 14, fill=OK, stroke=OK, sw=0, r=4))
    out.append(note(242, 694, "双脚全脚掌始终踩实地面", color=OK, size=17.5))
    out.append(text(242, 720, "严禁双脚离地死挂！", size=17, color=DANGER, weight=800))

    # 负荷分配标注
    out.append(badge(238, 340, 182, 30, "手指仅承受 30–35 kg", bg=ACCENT, size=16.5))
    out.append(text(238, 392, "约 40%–50% 体重", size=18, color=INK, weight=700))
    out.append(text(238, 418, "其余重量由双脚卸载", size=17, color=FAR, weight=600))

    # 右上：20mm 四指洞半抠解剖图
    out.append(grip_cross_section(456, 134, 304, 310, "half"))

    # 右下：滑车韧带「海绵挤压效应」6 组循环面板
    rx, ry = 456, 462
    out.append(rect(rx, ry, 304, 262, fill="#fff", stroke=INK, sw=3, r=14))
    out.append(text(rx + 152, ry + 32, "滑车韧带「海绵挤压效应」", size=20, color=INK, weight=900, anchor="middle"))
    out.append(badge(rx + 20, ry + 48, 264, 34, "① 发力拉紧 10 秒：挤压排空滑液", bg=ACCENT, size=16.5))
    out.append(arrow((rx + 152, ry + 86), (rx + 152, ry + 110), color=INK, w=4, head=10))
    out.append(badge(rx + 20, ry + 114, 264, 34, "② 站起放松 20 秒：胶原与血流回灌", bg=OK, size=16.5))
    out.append(text(rx + 152, ry + 176, "连续循环 × 6 组（共 3 分钟）", size=18, color=INK, weight=800, anchor="middle"))
    out.append(note(rx + 28, ry + 210, "体感：前臂温和牵拉充血感", size=17.5))
    out.append(note(rx + 28, ry + 238, "完全不酸痛、不疲劳（周日储备）", color=OK, size=17.5))

    return frame("双脚踩地减重悬垂（No-Hangs）", "".join(out), "手指拉力 30–35 kg (40–50% 体重) · 【拉紧 10 秒 + 放松 20 秒】× 6 组 · 严禁离地")


# ==============================================================================
# 9. 攀岩热身（手腕/肩袖动态环绕 + 3 条 V0-V1 直臂静脚攀爬）
# ==============================================================================
def warmup():
    out = []
    out.append(rect(44, 136, 330, 588, fill="#fff", stroke=INK, sw=3, r=14))
    out.append(badge(68, 156, 282, 32, "① 关节动态唤醒：手腕 + 肩袖环绕", bg=ACCENT, size=17))
    out.append(floor(692, 68, 350))

    cx = 209
    out.append(line([(cx, 320), (cx, 486)], INK, 15))
    out.append(circle((cx, 276), 25, INK, fill="#fff", w=6.5))
    out.append(line([(cx - 8, 486), (cx - 32, 588), (cx - 36, 686)], INK, 11))
    out.append(line([(cx + 8, 486), (cx + 32, 588), (cx + 36, 686)], INK, 11))
    out.append(line([(cx - 16, 330), (112, 266)], INK, 10))
    out.append(line([(cx + 16, 330), (306, 266)], INK, 10))
    for ax in (112, 306):
        out.append(f'<path d="M{ax - 36},{266} A36,36 0 1 1 {ax},{302}" fill="none" stroke="{ACCENT}" stroke-width="4"/>')
        out.append(arrow((ax + 6, 302), (ax - 4, 302), head=12))
    out.append(circle((cx - 24, 330), 22, ACCENT, fill="none", w=2.5, dash="5 4"))
    out.append(circle((cx + 24, 330), 22, ACCENT, fill="none", w=2.5, dash="5 4"))
    out.append(note(74, 410, "手腕顺/逆时针充分环绕", size=19))
    out.append(note(74, 448, "肩袖前后大幅度动态画圈", size=19))
    out.append(text(74, 482, "唤醒关节滑液后再上墙", size=18, color=FAR, weight=700))

    out.append(rect(404, 136, 352, 588, fill="#fff", stroke=INK, sw=3, r=14))
    out.append(badge(424, 156, 312, 32, "② 肌腱唤醒：连续爬 3 条 V0–V1", bg=INK, size=17))
    holds = [(476, 250), (636, 240), (546, 360), (676, 390), (496, 510), (642, 560), (516, 646)]
    for x, y in holds:
        out.append(f'<ellipse cx="{x}" cy="{y}" rx="17" ry="11" fill="{FAR}"/>')

    c_sh = (596, 404)
    c_hip = (588, 502)
    out.append(line([c_sh, (636, 246)], INK, 10))
    out.append(line([(584, 408), (548, 366)], INK, 10))
    out.append(line([c_sh, c_hip], INK, 14))
    out.append(circle((596, 366), 21, INK, fill="#fff", w=6))
    out.append(line([c_hip, (532, 476), (498, 508)], INK, 10))
    out.append(line([c_hip, (628, 522), (640, 556)], INK, 10))
    out.append(circle((498, 508), 24, OK, fill="none", w=2.5, dash="4 4"))
    out.append(note(430, 610, "手臂保持伸直（靠骨骼挂住）", size=19))
    out.append(note(430, 646, "脚步无声精准踩点", color=OK, size=19))
    out.append(text(430, 680, "温和唤醒手指屈肌腱，不追求泵感", size=18, color=FAR, weight=700))

    return frame("周日阶段 1：热身与肌腱唤醒", "".join(out), "耗时 10 分钟 · 手腕肩袖动态环绕 + 连续攀爬 3 条 V0–V1 极简单线路")


# ==============================================================================
# 10. 极限抱石突破（Bouldering）—— 15-40 秒短平快爆发 + 强制 3-5 分钟看表休息
# ==============================================================================
def boulder():
    out = []
    out.append(poly([(66, 680), (246, 146), (486, 146), (486, 680)], fill="#fff", stroke=INK, w=4))
    out.append(rect(54, 680, 444, 42, fill="#e4e1d8", stroke=INK, sw=3, r=6))
    out.append(text(276, 708, "厚防摔垫（Crash Pad）", size=18, color=FAR, weight=700, anchor="middle"))

    holds = [(266, 594), (326, 492), (416, 412), (356, 316), (436, 226), (456, 168)]
    out.append(line(holds, ACCENT, 3, dash="5 7"))
    for x, y in holds:
        out.append(f'<ellipse cx="{x}" cy="{y}" rx="19" ry="12" fill="{ACCENT}"/>')

    sh = (368, 396)
    hip = (358, 488)
    out.append(line([(358, 396), (342, 356), (356, 320)], INK, 10))
    out.append(line([(378, 398), (402, 422), (414, 412)], INK, 10))
    out.append(line([sh, hip], INK, 14))
    out.append(circle((370, 358), 20, INK, fill="#fff", w=6))
    out.append(line([hip, (318, 466), (326, 490)], INK, 10))
    out.append(line([hip, (324, 548), (268, 592)], INK, 10))

    out.append(rect(68, 168, 210, 106, fill=INK, stroke=INK, sw=0, r=12))
    out.append(text(173, 208, "单条线路 15–40 秒", size=21, color="#fff", weight=800, anchor="middle"))
    out.append(text(173, 238, "短平快极限难度突破", size=17.5, color="#cfd3ff", weight=700, anchor="middle"))
    out.append(text(173, 262, "契合 ATP-CP 高爆发基因", size=15.5, color="#9ea8ff", weight=600, anchor="middle"))

    rx, ry = 510, 146
    out.append(rect(rx, ry, 250, 576, fill="#fff", stroke=INK, sw=3.5, r=14))
    out.append(badge(rx + 18, ry + 20, 214, 34, "脱落/完攀后铁律", bg=DANGER, size=18))
    tc = (rx + 125, ry + 138)
    out.append(circle(tc, 54, ACCENT, fill="#eef1ff", w=5))
    out.append(line([(tc[0] - 14, tc[1] - 62), (tc[0] + 14, tc[1] - 62)], INK, 6))
    out.append(line([tc, (tc[0], tc[1] - 34)], INK, 5))
    out.append(line([tc, (tc[0] + 26, tc[1] + 12)], ACCENT, 5))
    out.append(text(rx + 125, ry + 226, "强制看表休息", size=22, color=INK, weight=900, anchor="middle"))
    out.append(text(rx + 125, ry + 260, "满 3 – 5 分钟", size=28, color=ACCENT, weight=900, anchor="middle"))

    out.append(line([(rx + 22, ry + 286), (rx + 228, ry + 286)], LINE, 2.5))
    out.append(note(rx + 28, ry + 324, "严禁呼吸急促时连上", color=DANGER, size=18.5))
    out.append(note(rx + 28, ry + 362, "严禁小臂发酸时死磕", color=DANGER, size=18.5))
    out.append(text(rx + 22, ry + 412, "为什么必须休满？", size=18, color=INK, weight=800))
    out.append(text(rx + 22, ry + 442, "肌肉疲劳卸力时，落地与抓握", size=16.5, color=FAR, weight=600))
    out.append(text(rx + 22, ry + 468, "冲击力会直接转移至：", size=16.5, color=FAR, weight=600))
    out.append(badge(rx + 22, ry + 486, 206, 30, "⚠ 手指 A2/A4 滑车韧带", bg="#fdecec", fg=DANGER, size=16))
    out.append(badge(rx + 22, ry + 524, 206, 30, "⚠ 膝盖前交叉韧带 (ACL)", bg="#fdecec", fg=DANGER, size=16))

    return frame("周日阶段 2：极限抱石突破（Bouldering）", "".join(out), "耗时 40 分钟 · 专注极限 V 级短线 (15–40s) · 每次脱落强制看表休息 3–5 分钟")


# ==============================================================================
# 11. 长寿心肺与血管清理收尾（Double Tabata）
# ==============================================================================
def tabata():
    out = []
    out.append(rect(56, 126, 688, 44, fill="#fff", stroke=ACCENT, sw=3, r=10))
    out.append(text(400, 155, "攀岩彻底结束后：脱下攀岩鞋 → 换上平底运动鞋（彻底解放脚趾与手指）", size=18.5, color=ACCENT, weight=800, anchor="middle"))

    def round_row(yy, title_str):
        o = [text(56, yy - 114, title_str, size=20.5, weight=900)]
        xx = 56
        for _ in range(8):
            o.append(rect(xx, yy - 96, 56, 96, fill=ACCENT, stroke=ACCENT, sw=0, r=4))
            o.append(text(xx + 28, yy - 42, "20s", size=16, color="#fff", weight=800, anchor="middle"))
            o.append(rect(xx + 56, yy - 34, 28, 34, fill=GHOST, stroke=GHOST, sw=0, r=3))
            o.append(text(xx + 70, yy - 11, "10s", size=13, color=INK, weight=700, anchor="middle"))
            xx += 86
        o.append(line([(56, yy), (56 + 8 * 86 - 2, yy)], INK, 3.5, cap="butt"))
        return "".join(o)

    out.append(round_row(316, "第 1 轮 Tabata（4 分钟）：【20 秒 95% 全力冲刺 + 10 秒站立深呼吸】× 8 次"))

    out.append(rect(56, 338, 686, 58, fill="#fff", stroke=OK, sw=3.5, r=10, dash="8 5"))
    out.append(text(400, 365, "中场恢复（2 分钟）：保持直立慢走 + 深呼吸", size=20, color=OK, weight=800, anchor="middle"))
    out.append(text(400, 388, "× 严禁直接坐下或弯腰低头（防止血压骤降与头晕）", size=16.5, color=DANGER, weight=700, anchor="middle"))

    out.append(round_row(544, "第 2 轮 Tabata（4 分钟）：再次【20 秒全力冲刺 + 10 秒休息】× 8 次"))

    out.append(rect(56, 568, 686, 154, fill="#fff", stroke=INK, sw=3, r=12))
    out.append(note(82, 602, "动作四选一：风阻单车 (Assault Bike) / 划船机 / 徒手深蹲跳 / 不贴地波比跳", color=INK, size=17.5))
    out.append(note(82, 640, "生理目标：突破「低心率反应」，拉升 VO2 Max 与 HDL（好胆固醇）脉冲、清理 LDL", color=ACCENT, size=17))
    out.append(note(82, 678, "安全铁律：冲刺全程保持节奏呼吸，严禁憋气；若胸闷头晕立即停止", color=DANGER, size=17.5))

    return frame("周日阶段 3：Double Tabata 血管清理", "".join(out), "耗时 10 分钟 · 4 分钟冲刺轮 + 2 分钟直立慢走 + 4 分钟冲刺轮 · 换平底鞋执行")


# ==============================================================================
# 12. 出差补丁：指力板宽沿慢离心引体 + 1 轮 Tabata
# ==============================================================================
def patch():
    out = []
    cx = 185
    hb, jug_y, _ = hangboard_front(cx, 152, w=210, active="jug")
    out.append(hb)
    out.append(floor(726, 40, 380))

    lh, rh = (cx - 64, jug_y + 2), (cx + 64, jug_y + 2)

    # ① 顶端锁死 2 秒（实线：下巴拉到指力板顶部高度！手肘向两侧下方收紧）
    top_sh_y = 222
    top_hip_y = 378
    out.append(line([lh, (cx - 82, 214), (cx - 44, top_sh_y)], INK, 10))
    out.append(line([rh, (cx + 82, 214), (cx + 44, top_sh_y)], INK, 10))
    out.append(poly([(cx - 44, top_sh_y), (cx + 44, top_sh_y), (cx + 21, top_hip_y), (cx - 21, top_hip_y)], fill="#fff", stroke=INK, w=7.5))
    out.append(line([(cx, top_sh_y), (cx, 166)], INK, 8))
    out.append(circle((cx, 144), 21, INK, fill="#fff", w=6.5))
    out.append(line([(cx - 14, top_hip_y), (cx - 15, 488), (cx - 14, 578)], INK, 9.5))
    out.append(line([(cx + 14, top_hip_y), (cx + 15, 488), (cx + 14, 578)], INK, 9.5))

    # ② 底部直臂悬垂（虚线：4 秒超慢离心下放终点）
    bot_sh_y = 338
    bot_hip_y = 494
    out.append(line([lh, (cx - 42, bot_sh_y)], GHOST, 8, dash="8 6"))
    out.append(line([rh, (cx + 42, bot_sh_y)], GHOST, 8, dash="8 6"))
    out.append(poly([(cx - 42, bot_sh_y), (cx + 42, bot_sh_y), (cx + 20, bot_hip_y), (cx - 20, bot_hip_y)], fill="none", stroke=GHOST, w=6, dash="8 6"))
    out.append(circle((cx, 282), 20, GHOST, fill="none", w=5.5, dash="8 6"))
    out.append(line([(cx - 14, bot_hip_y), (cx - 14, 696)], GHOST, 8, dash="8 6"))
    out.append(line([(cx + 14, bot_hip_y), (cx + 14, 696)], GHOST, 8, dash="8 6"))

    # 1秒拉起 & 4秒慢放双向箭头
    out.append(arrow((64, 360), (64, 200), color=INK, w=5))
    out.append(text(64, 184, "1s 拉起", size=16.5, color=INK, weight=800, anchor="middle"))
    out.append(arrow((308, 210), (308, 460), color=ACCENT, w=5.5))
    out.append(badge(260, 470, 96, 28, "4s 慢离心", bg=ACCENT, size=16))

    # 右侧：慢离心节奏条 + 1 轮 Tabata 闭环（rx=396, w=364，完全包裹所有文字）
    rx = 396
    out.append(rect(rx, 142, 364, 342, fill="#fff", stroke=INK, sw=3, r=14))
    out.append(text(rx + 20, 180, "① 指力板宽沿引体（3 组 × 5 次）", size=19.5, color=INK, weight=900))
    segs = [
        ("1 秒", "爆发拉起（下巴过板沿）", 58, INK),
        ("2 秒", "顶端死死锁住", 96, ACCENT),
        ("4 秒", "超慢速离心下放到底", 148, OK),
    ]
    yy = 204
    for sec_txt, desc, bw, col in segs:
        out.append(badge(rx + 20, yy, bw, 36, sec_txt, bg=col, size=17.5))
        out.append(text(rx + 20 + bw + 10, yy + 24, desc, size=17, color=INK, weight=700))
        yy += 54
    out.append(note(rx + 32, 396, "抓握最上方宽大平沿 (Jug)，略宽于肩", size=17.5))
    out.append(note(rx + 32, 430, "下放必须匀速满 4 秒，不自由落体", size=17.5))
    out.append(note(rx + 32, 464, "替代周日攀岩的背部「拉」类负荷", size=17.5))

    # 右下：+ 1 轮 4 分钟 Tabata
    out.append(rect(rx, 504, 364, 222, fill="#fff", stroke=ACCENT, sw=3, r=14))
    out.append(badge(rx + 24, 524, 316, 32, "② 紧接 1 轮 4 分钟 Tabata（补心肺）", bg=ACCENT, size=17))
    xx = rx + 34
    for _ in range(8):
        out.append(rect(xx, 574, 24, 44, fill=ACCENT, stroke=ACCENT, sw=0, r=3))
        out.append(rect(xx + 24, 602, 11, 16, fill=GHOST, stroke=GHOST, sw=0, r=2))
        xx += 37
    out.append(text(rx + 182, 648, "【20 秒全力冲刺 + 10 秒休息】× 8 次", size=17.5, color=INK, weight=800, anchor="middle"))
    out.append(text(rx + 182, 682, "何时触发：若周日出差去不了攀岩馆，", size=16.5, color=FAR, weight=700, anchor="middle"))
    out.append(text(rx + 182, 706, "直接在周五居家力量日末尾加上此补丁闭环", size=16.5, color=INK, weight=700, anchor="middle"))

    return frame("出差补丁：宽沿慢离心引体 + Tabata", "".join(out), "周五力量日末尾追加 · 宽沿引体 3 组 × 5 次 (1s拉/2s锁/4s放) + 1 轮 4 分钟 Tabata")


svgs = {
    "scapular-pullups": scap(),
    "max-hangs": maxhang(),
    "goblet-squat": goblet(),
    "bulgarian-split-squat": bulgarian(),
    "pike-pushup": pike(),
    "weighted-pushup": weighted(),
    "cossack-split": cossack(),
    "no-hangs": nohang(),
    "climbing-warmup": warmup(),
    "bouldering": boulder(),
    "double-tabata": tabata(),
    "travel-patch": patch(),
}

OUT.mkdir(parents=True, exist_ok=True)
for name, svg in svgs.items():
    (OUT / f"{name}.svg").write_text(svg, encoding="utf-8")
print(f"wrote {len(svgs)} svg → {OUT}")
