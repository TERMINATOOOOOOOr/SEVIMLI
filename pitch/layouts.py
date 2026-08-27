"""Спец-раскладки слайдов дека SEVIMLI (титул, таблица, бизнес-модель, таймлайн, контакты)."""

from pptx.util import Inches, Pt, Emu
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

from theme import (
    SLIDE_W, SLIDE_H, BG_LIGHT, BAND, ACCENT, ACCENT_DEEP, ACCENT_SOFT,
    BODY, MUTED, WHITE, GOLD, FONT, FONT_BOLD, RGB_QR, RGB_BTN2, RGB_BTN3,
    rect, round_rect, textbox, para, base, title, body, bullets, note, stat_card,
    est_lines,
)


# ---------- 01 Титул ----------
def slide_title(prs, c):
    s = base(prs, "01")

    # Нижняя плашка с описанием — как в шаблоне.
    band_h = Inches(2.05)
    rect(s, 0, SLIDE_H - band_h, SLIDE_W, band_h, BAND)

    # Логотип-обёртка
    tf = textbox(s, Inches(1.0), Inches(1.55), Inches(11.3), Inches(1.3), PP_ALIGN.CENTER)
    para(tf, c["brand"], 76, WHITE, bold=True, first=True)

    tf = textbox(s, Inches(1.0), Inches(2.95), Inches(11.3), Inches(0.5), PP_ALIGN.CENTER)
    para(tf, c["tagline"], 19, ACCENT, first=True)

    # Разделительная линия
    rect(s, Inches(6.17), Inches(3.72), Inches(1.0), Inches(0.045), ACCENT)

    # Пилюли-фичи
    pills = c["pills"]
    pw, gap = Inches(2.85), Inches(0.22)
    total = pw * len(pills) + gap * (len(pills) - 1)
    x = (SLIDE_W - total) / 2
    for p in pills:
        box = round_rect(s, x, Inches(4.12), pw, Inches(0.62), BG_LIGHT, adj=0.5)
        box.line.color.rgb = ACCENT_DEEP
        box.line.width = Pt(0.75)
        tf = textbox(s, x, Inches(4.12), pw, Inches(0.62), PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        para(tf, p, 12.5, ACCENT_SOFT, first=True)
        x += pw + gap

    # Описание на плашке
    tf = textbox(s, Inches(1.3), SLIDE_H - band_h + Inches(0.5), Inches(10.7), Inches(1.2),
                 PP_ALIGN.CENTER)
    para(tf, c["desc"], 17.5, WHITE, bold=True, line=1.4, first=True)
    return s


# ---------- Текст + правая колонка с карточками ----------
def slide_text_cards(prs, number, c, cards=None, card_title=None):
    s = base(prs, number)
    # Узкая колонка, если справа карточки; иначе — во всю ширину.
    tw = Inches(6.05) if cards else Inches(11.4)
    bw = Inches(5.95) if cards else Inches(11.2)

    y = title(s, c["title"], y=Inches(1.22), w=tw)
    y = body(s, c["body"], y=y + Inches(0.26), w=bw, size=14)
    if c.get("bullets"):
        y = bullets(s, c["bullets"], y=y + Inches(0.2), w=bw, size=12.5)
    if c.get("note"):
        note(s, c["note"], y=max(y + Inches(0.22), Inches(6.35)),
             w=bw, size=9.5)

    if cards:
        x0, y0 = Inches(7.7), Inches(1.75)
        cw, ch, g = Inches(4.75), Inches(1.12), Inches(0.24)
        if card_title:
            tf = textbox(s, x0, Inches(1.25), cw, Inches(0.4))
            para(tf, card_title, 12, ACCENT, bold=True, first=True)
        for i, (val, lab) in enumerate(cards):
            yy = y0 + (ch + g) * i
            card = round_rect(s, x0, yy, cw, ch, BG_LIGHT, adj=0.14)
            card.line.color.rgb = ACCENT_DEEP
            card.line.width = Pt(0.75)
            rect(s, x0, yy + Inches(0.2), Inches(0.055), ch - Inches(0.4), ACCENT)
            tf = textbox(s, x0 + Inches(0.32), yy + Inches(0.2), cw - Inches(0.6), Inches(0.42))
            para(tf, val, 21, WHITE, bold=True, first=True)
            tf = textbox(s, x0 + Inches(0.32), yy + Inches(0.66), cw - Inches(0.6), Inches(0.36))
            para(tf, lab, 11.5, ACCENT_SOFT, line=1.15, first=True)
    return s


# ---------- 05 Таблица конкурентов ----------
def slide_competitors(prs, c):
    """Оценка — тремя точками, а не эмодзи: эмодзи в PowerPoint рендерятся
    монохромно и не читаются на проекторе."""
    s = base(prs, "05")

    tf = textbox(s, Inches(0.9), Inches(1.05), Inches(4.4), Inches(0.9))
    for i, ln in enumerate(c["title"].split("\n")):
        para(tf, ln, 23, WHITE, bold=True, line=1.1, first=(i == 0))

    cols = c["columns"]
    rows = c["rows"]              # [(критерий, [балл 0..3, ...]), ...]
    x_label = Inches(0.9)
    x0, colw = Inches(5.5), Inches(1.9)
    y0, rowh = Inches(2.12), Inches(0.53)

    # Шапка колонок
    for i, col in enumerate(cols):
        cx = x0 + colw * i
        is_us = i == 0
        if is_us:
            hl = round_rect(s, cx + Inches(0.06), Inches(1.12), colw - Inches(0.12),
                            Inches(0.64), ACCENT_DEEP, adj=0.24)
            hl.line.fill.background()
        tf = textbox(s, cx, Inches(1.12), colw, Inches(0.64), PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        para(tf, col, 13 if is_us else 12, WHITE if is_us else ACCENT_SOFT,
             bold=is_us, first=True)

    dot_d = Inches(0.135)
    dot_gap = Inches(0.075)
    triple_w = dot_d * 3 + dot_gap * 2

    for r, (label, scores) in enumerate(rows):
        yy = y0 + rowh * r
        if r % 2 == 0:
            rect(s, x_label - Inches(0.22), yy, Inches(11.9), rowh, BG_LIGHT)
        tf = textbox(s, x_label, yy, Inches(4.4), rowh, PP_ALIGN.LEFT, MSO_ANCHOR.MIDDLE)
        para(tf, label, 12, BODY, first=True)

        for i, score in enumerate(scores):
            cx = x0 + colw * i + (colw - triple_w) / 2
            cy = yy + (rowh - dot_d) / 2
            for d in range(3):
                dot = s.shapes.add_shape(MSO_SHAPE.OVAL, cx + (dot_d + dot_gap) * d,
                                         cy, dot_d, dot_d)
                dot.shadow.inherit = False
                if d < score:
                    dot.fill.solid()
                    dot.fill.fore_color.rgb = WHITE if i == 0 else ACCENT
                    dot.line.fill.background()
                else:
                    dot.fill.background()
                    dot.line.color.rgb = MUTED
                    dot.line.width = Pt(0.75)

    rect(s, x0 - Inches(0.1), y0 - Inches(0.08), Inches(0.012),
         rowh * len(rows) + Inches(0.16), ACCENT_DEEP)

    # Легенда
    ly = y0 + rowh * len(rows) + Inches(0.14)
    tf = textbox(s, x_label, ly, Inches(11.5), Inches(0.3))
    para(tf, "●●● сильная сторона   ·   ●●○ частично   ·   ●○○ слабо   ·   ○○○ нет",
         10, MUTED, first=True)

    if c.get("note"):
        note(s, c["note"], y=ly + Inches(0.34), w=Inches(11.6), size=9.5)
    return s


# ---------- 07 Бизнес-модель: ключ → значение ----------
def slide_biz(prs, c):
    """Ключ → значение. Высота строки считается по фактическому переносу,
    иначе сноска наезжает на следующее значение."""
    s = base(prs, "07")
    tf = textbox(s, Inches(0.9), Inches(0.95), Inches(6.0), Inches(0.8))
    para(tf, c["title"], 32, WHITE, bold=True, first=True)

    x_val = Inches(4.95)
    val_w = Inches(7.65)
    y = Inches(1.95)

    for row in c["rows"]:
        key, val, sub = row["key"], row["value"], row.get("sub")

        tf = textbox(s, Inches(0.9), y, Inches(2.9), Inches(0.4))
        para(tf, key, 13.5, ACCENT_SOFT, line=1.15, first=True)

        # Стрелка
        rect(s, Inches(3.95), y + Inches(0.1), Inches(0.55), Inches(0.026), ACCENT)
        ah = s.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE, Inches(4.44),
                                y + Inches(0.037), Inches(0.15), Inches(0.15))
        ah.fill.solid()
        ah.fill.fore_color.rgb = ACCENT
        ah.line.fill.background()
        ah.rotation = 90
        ah.shadow.inherit = False

        vh = Inches(est_lines(val, val_w.inches, 15) * 15 * 1.2 / 72)
        tf = textbox(s, x_val, y - Inches(0.04), val_w, vh)
        for j, ln in enumerate(val.split("\n")):
            para(tf, ln, 15, WHITE, bold=True, line=1.2, first=(j == 0))
        yy = y + vh + Inches(0.03)

        if sub:
            sh = Inches(est_lines(sub, val_w.inches, 10) * 10 * 1.3 / 72)
            tf = textbox(s, x_val, yy, val_w, sh)
            for j, ln in enumerate(sub.split("\n")):
                para(tf, ln, 10, MUTED, line=1.3, first=(j == 0))
            yy = yy + sh

        y = yy + Inches(0.22)

    if c.get("note"):
        note(s, c["note"], y=max(y + Inches(0.1), Inches(6.5)), w=Inches(11.6), size=9.5)
    return s


# ---------- 08 Milestones: таймлайн ----------
def slide_timeline(prs, c):
    s = base(prs, "08")
    tf = textbox(s, Inches(0.9), Inches(0.95), Inches(6.0), Inches(0.6))
    para(tf, c["title"], 30, WHITE, bold=True, first=True)

    body(s, c["body"], x=Inches(0.9), y=Inches(1.62), w=Inches(11.4), size=12.5)

    axis_y = Inches(4.32)
    x_start, x_end = Inches(0.9), Inches(12.55)
    rect(s, x_start, axis_y, x_end - x_start, Inches(0.026), ACCENT_SOFT)
    ah = s.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE, x_end, axis_y - Inches(0.06),
                            Inches(0.18), Inches(0.15))
    ah.fill.solid()
    ah.fill.fore_color.rgb = ACCENT_SOFT
    ah.line.fill.background()
    ah.rotation = 90
    ah.shadow.inherit = False

    items = c["items"]
    lab_w = Inches(2.45)
    # Держим последнюю подпись внутри полосы: правый край ≤ 12.7"
    span_a, span_b = Inches(1.15), Inches(10.15)
    step = (span_b - span_a) / max(1, len(items) - 1)
    leg_h = Inches(0.62)

    for i, it in enumerate(items):
        x = span_a + step * i
        up = i % 2 == 0

        marker = s.shapes.add_shape(
            MSO_SHAPE.ISOSCELES_TRIANGLE, x - Inches(0.07),
            axis_y - Inches(0.17) if up else axis_y + Inches(0.02),
            Inches(0.14), Inches(0.15))
        marker.fill.solid()
        marker.fill.fore_color.rgb = WHITE
        marker.line.fill.background()
        marker.rotation = 180 if up else 0
        marker.shadow.inherit = False

        rect(s, x - Inches(0.011), axis_y - leg_h if up else axis_y,
             Inches(0.022), leg_h, WHITE)

        n_lines = it["label"].count("\n") + 1
        lab_h = Inches(0.21 * n_lines)
        if up:
            date_y = axis_y - leg_h - lab_h - Inches(0.34)
        else:
            date_y = axis_y + leg_h + Inches(0.08)

        tf = textbox(s, x + Inches(0.13), date_y, lab_w, Inches(0.3))
        para(tf, it["date"], 14, WHITE, bold=True, first=True)
        tf = textbox(s, x + Inches(0.13), date_y + Inches(0.3), lab_w, lab_h)
        for j, ln in enumerate(it["label"].split("\n")):
            para(tf, ln, 11, ACCENT_SOFT, line=1.15, first=(j == 0))
    return s


# ---------- 09 Команда ----------
def slide_team(prs, c):
    s = base(prs, "09")
    y = title(s, c["title"], y=Inches(1.35))
    body(s, c["body"], y=y + Inches(0.3), w=Inches(5.4))

    x0, y0 = Inches(6.9), Inches(1.6)
    cw, ch, g = Inches(2.62), Inches(2.28), Inches(0.26)
    for i, m in enumerate(c["members"]):
        cx = x0 + (cw + g) * (i % 2)
        cy = y0 + (ch + g) * (i // 2)
        card = round_rect(s, cx, cy, cw, ch, BG_LIGHT, adj=0.1)
        card.line.color.rgb = ACCENT_DEEP
        card.line.width = Pt(0.75)

        av = s.shapes.add_shape(MSO_SHAPE.OVAL, cx + Inches(0.28), cy + Inches(0.26),
                                Inches(0.72), Inches(0.72))
        av.fill.solid()
        av.fill.fore_color.rgb = ACCENT_DEEP
        av.line.fill.background()
        av.shadow.inherit = False
        tf = textbox(s, cx + Inches(0.28), cy + Inches(0.26), Inches(0.72), Inches(0.72),
                     PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        para(tf, m["initial"], 22, WHITE, bold=True, first=True)

        tf = textbox(s, cx + Inches(0.28), cy + Inches(1.14), cw - Inches(0.5), Inches(0.36))
        para(tf, m["name"], 14, WHITE, bold=True, first=True)
        tf = textbox(s, cx + Inches(0.28), cy + Inches(1.48), cw - Inches(0.5), Inches(0.32))
        para(tf, m["role"], 11.5, ACCENT, first=True)
        tf = textbox(s, cx + Inches(0.28), cy + Inches(1.78), cw - Inches(0.5), Inches(0.42))
        para(tf, m["exp"], 10, MUTED, line=1.2, first=True)

    if c.get("note"):
        note(s, c["note"], y=Inches(6.55), w=Inches(5.6))
    return s


# ---------- 10 Контакты ----------
def slide_contacts(prs, c):
    s = base(prs, "10")
    tf = textbox(s, Inches(0.9), Inches(1.15), Inches(11.5), Inches(0.6), PP_ALIGN.CENTER)
    para(tf, c["title"], 24, WHITE, bold=True, first=True)

    # Плейсхолдер QR
    qx, qy, qs = Inches(2.35), Inches(2.25), Inches(2.85)
    q = rect(s, qx, qy, qs, qs, WHITE)
    q.line.fill.background()
    tf = textbox(s, qx, qy + Inches(1.1), qs, Inches(0.7), PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    para(tf, "QR", 30, RGB_QR, bold=True, first=True)
    para(tf, "вставьте QR-код", 10, RGB_QR, align=PP_ALIGN.CENTER)

    site = round_rect(s, qx, qy + qs + Inches(0.22), qs, Inches(0.6), ACCENT, adj=0.28)
    site.line.fill.background()
    tf = textbox(s, qx, qy + qs + Inches(0.22), qs, Inches(0.6), PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    para(tf, c["site"], 15, WHITE, bold=True, first=True)

    # Кнопки-контакты
    bx, bw, bh, bg = Inches(6.15), Inches(4.85), Inches(1.02), Inches(0.26)
    shades = [ACCENT, RGB_BTN2, RGB_BTN3]
    for i, item in enumerate(c["buttons"]):
        by = qy + (bh + bg) * i
        btn = round_rect(s, bx, by, bw, bh, shades[i % len(shades)], adj=0.22)
        btn.line.fill.background()
        tf = textbox(s, bx + Inches(0.35), by, Inches(0.8), bh, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        para(tf, item["icon"], 21, WHITE, first=True)
        tf = textbox(s, bx + Inches(1.25), by, bw - Inches(1.5), bh, PP_ALIGN.LEFT, MSO_ANCHOR.MIDDLE)
        para(tf, item["value"], 17, WHITE, bold=True, first=True)

    if c.get("note"):
        note(s, c["note"], y=Inches(6.35), w=Inches(11.5), size=10.5)
    return s
