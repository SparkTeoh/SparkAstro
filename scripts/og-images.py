# 分享预览图（og:image，1200×630）：生成 public/og-cover.png 和 public/og/stack-<slug>.png
# 用法：python3 scripts/og-images.py          （需要本机装有 Google Chrome 和 Noto Sans SC 字体）
# 配色跟 src/styles/site.css 的 --sp-* token 保持一致；新增清单时在 CARDS 里加一行再跑一次。
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

INK = "#003054"
ACCENT = "#f8961d"
SOFT = "#4a6072"

# (输出路径, 眉标, 标题——用 [] 括住要划重点的词, 副标题, 按钮上的网址)
CARDS = [
    ("public/og-cover.png", "官方网站", "你的理财[引路人]。", "认准官方渠道，与我一起安全理财。", "sparkliang.com"),
    ("public/og/stack-hair.png", "我的清单", "我的[生发]清单", "阻断 + 促生 + 清洁 + 物理刺激，每天怎么用都写清楚。", "sparkliang.com/hair"),
    ("public/og/stack-skincare.png", "我的清单", "我的[皮肤管理]清单", "极油皮、闭口、痘印，怎么做到干净哑光。", "sparkliang.com/skin"),
    ("public/og/stack-workout.png", "我的清单", "我的[运动]清单", "指力 + 力量 + 柔韧 + 攀岩，每个动作都有图解。", "sparkliang.com/workout"),
    ("public/og/stack-diet.png", "我的清单", "我的[饮食与保健品]清单", "早餐一杯植物奶昔，保健品按五个时间点吃，每天固定。", "sparkliang.com/diet"),
    ("public/og/stack-gadget.png", "我的清单", "我的[数码配件]清单", "不追新，只写我天天在用、出门一定会带的数码配件。", "sparkliang.com/gadget"),
    ("public/og/stack-coffee.png", "我的清单", "我的[咖啡器材]清单", "在家煮意式咖啡用的两样东西：一台咖啡机、一台磨豆机。", "sparkliang.com/coffee"),
]

PAGE = """<!doctype html>
<html lang="zh-Hans"><head><meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; }}
  html, body {{ width: 1200px; height: 630px; overflow: hidden; }}
  body {{
    position: relative;
    background: #fff linear-gradient({ink}0f 2px, transparent 2px) 0 40px / 100% 42px;
    color: {ink};
    font-family: "Noto Sans SC", "PingFang SC", sans-serif;
  }}
  .wrap {{ position: absolute; left: 72px; right: 72px; top: 50%; transform: translateY(-52%); }}
  .eyebrow {{
    display: flex; align-items: center; gap: 14px;
    font: 700 23px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.02em;
  }}
  .eyebrow::before {{ content: ""; width: 19px; height: 19px; background: {accent}; border: 2.5px solid {ink}; }}
  h1 {{ margin-top: 22px; font-size: {size}px; font-weight: 900; line-height: 1.18; white-space: nowrap; }}
  h1 em {{
    font-style: normal;
    background: linear-gradient(transparent 60%, {accent}73 60% 90%, transparent 90%);
  }}
  p {{ margin-top: 22px; font-size: 34px; line-height: 1.3; color: {soft}; white-space: nowrap; }}
  .btn {{
    display: inline-block; margin-top: 46px; padding: 17px 38px;
    font: 700 30px/1.2 "Helvetica Neue", Helvetica, Arial, sans-serif;
    background: {accent}; color: {ink};
    border: 3px solid {ink}; border-radius: 16px; box-shadow: 7px 7px 0 {ink};
  }}
</style></head>
<body><div class="wrap">
  <div class="eyebrow">SPARK LIANG · {eyebrow}</div>
  <h1>{title}</h1>
  <p>{lede}</p>
  <span class="btn">{url}</span>
</div></body></html>
"""


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


with tempfile.TemporaryDirectory() as tmp:
    for out, eyebrow, title, lede, url in CARDS:
        plain = title.replace("[", "").replace("]", "")
        size = min(112, int(1040 / len(plain)))  # 标题太长时自动缩小，保证一行放得下
        html = PAGE.format(
            ink=INK, accent=ACCENT, soft=SOFT, size=size,
            eyebrow=esc(eyebrow), lede=esc(lede), url=esc(url),
            title=esc(title).replace("[", "<em>").replace("]", "</em>"),
        )
        src = pathlib.Path(tmp) / "card.html"
        src.write_text(html, encoding="utf-8")
        dest = ROOT / out
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
             "--window-size=1200,630", f"--screenshot={dest}", src.as_uri()],
            check=True, capture_output=True,
        )
        print("og", out)
