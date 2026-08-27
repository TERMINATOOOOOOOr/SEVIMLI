"""
Дизайн-система питч-дека SEVIMLI под шаблон President Tech Award (IT Park).

Шаблон: тёмно-синий фон с диагональным паттерном, голубые акценты,
крупный номер слайда в правом верхнем углу, геометричный гротеск.
Шрифт: Segoe UI — есть на любой Windows (Montserrat/Poppins не установлены,
подставлять их рискованно: у жюри поедет вёрстка).
"""

import math

from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ---------- Холст ----------
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

# ---------- Палитра (снята с шаблона) ----------
BG          = RGBColor(0x1B, 0x3A, 0x5C)  # основной тёмно-синий
BG_DARK     = RGBColor(0x15, 0x30, 0x4D)  # тёмная грань паттерна
BG_LIGHT    = RGBColor(0x21, 0x46, 0x6C)  # светлая грань паттерна
BAND        = RGBColor(0x24, 0x4E, 0x78)  # нижняя плашка (слайд 01)
ACCENT      = RGBColor(0x4A, 0x9E, 0xEE)  # яркий голубой
ACCENT_DEEP = RGBColor(0x2E, 0x7C, 0xC8)
ACCENT_SOFT = RGBColor(0x8F, 0xC6, 0xF7)
BODY        = RGBColor(0xB2, 0xCB, 0xE3)  # основной текст (светло-голубой)
MUTED       = RGBColor(0x8A, 0xA8, 0xC6)  # сноски
WHITE       = RGBColor(0xFF, 0xFF, 0xFF)
GOLD        = RGBColor(0xF5, 0xC2, 0x42)  # выделение цифр

# Слайд контактов: тёмный текст на белом QR + градация кнопок, как в шаблоне.
RGB_QR   = RGBColor(0x1B, 0x3A, 0x5C)
RGB_BTN2 = RGBColor(0x4E, 0x86, 0xBE)
RGB_BTN3 = RGBColor(0x55, 0x7F, 0xAF)

FONT = "Segoe UI"
FONT_BOLD = "Segoe UI Semibold"


# ---------- Примитивы ----------
def _no_line(shape):
    shape.line.fill.background()
    return shape


def rect(slide, x, y, w, h, color, shape=MSO_SHAPE.RECTANGLE):
    s = slide.shapes.add_shape(shape, x, y, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.shadow.inherit = False
    return _no_line(s)


def round_rect(slide, x, y, w, h, color, adj=0.18):
    s = rect(slide, x, y, w, h, color, MSO_SHAPE.ROUNDED_RECTANGLE)
    try:
        s.adjustments[0] = adj
    except (IndexError, ValueError):
        pass
    return s


def triangle(slide, x, y, w, h, color, rotation=0):
    s = slide.shapes.add_shape(MSO_SHAPE.RIGHT_TRIANGLE, x, y, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.rotation = rotation
    s.shadow.inherit = False
    return _no_line(s)


def textbox(slide, x, y, w, h, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.paragraphs[0].alignment = align
    return tf


def para(tf, text, size, color, bold=False, font=None, space_after=0,
         space_before=0, align=None, line=None, first=False):
    """Добавляет абзац (или заполняет первый) с заданным стилем."""
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.text = text
    p.space_after = Pt(space_after)
    p.space_before = Pt(space_before)
    if align is not None:
        p.alignment = align
    if line is not None:
        p.line_spacing = line
    f = p.runs[0].font if p.runs else p.font
    f.name = font or (FONT_BOLD if bold else FONT)
    f.size = Pt(size)
    f.bold = bold
    f.color.rgb = color
    return p


# ---------- Каркас слайда ----------
def background(slide):
    """Тёмно-синий фон + едва заметный диагональный паттерн, как в шаблоне."""
    rect(slide, 0, 0, SLIDE_W, SLIDE_H, BG)
    # Крупные диагональные грани — низкий контраст, только фактура.
    triangle(slide, Emu(0), Emu(0), Inches(5.6), Inches(7.5), BG_DARK)
    triangle(slide, Inches(8.4), Emu(0), Inches(4.9), Inches(7.5), BG_LIGHT, rotation=180)
    triangle(slide, Inches(3.1), Inches(3.6), Inches(3.4), Inches(3.9), BG_LIGHT, rotation=180)
    triangle(slide, Inches(9.9), Inches(0.0), Inches(3.4), Inches(3.2), BG_DARK)


def slide_number(slide, number):
    """Крупный номер в правом верхнем углу."""
    tf = textbox(slide, Inches(11.5), Inches(0.34), Inches(1.5), Inches(0.9), PP_ALIGN.RIGHT)
    para(tf, number, 40, WHITE, bold=True, first=True)


def base(prs, number):
    """Пустой слайд с фоном и номером."""
    s = prs.slides.add_slide(prs.slide_layouts[6])
    background(s)
    if number:
        slide_number(s, number)
    return s


def title(slide, text, x=Inches(0.9), y=Inches(1.7), w=Inches(6.4), size=27):
    """Заголовок слайда — белый, жирный, заглавными."""
    lines = text.count("\n") + 1
    tf = textbox(slide, x, y, w, Inches(0.52 * lines))
    for i, ln in enumerate(text.split("\n")):
        para(tf, ln, size, WHITE, bold=True, line=1.12, first=(i == 0))
    return y + Inches(0.52 * lines)


#: Средняя ширина глифа Segoe UI в долях кегля (кириллица, смешанный регистр).
CHAR_W = 0.52
#: Реальная высота строки в PowerPoint ≈ 1.2× кегля даже при line_spacing=1.0.
LINE_F = 1.2


def est_lines(text, width_in, size, char_w=CHAR_W):
    """Оценка числа строк ПОСЛЕ переноса.

    python-pptx не умеет измерять текст, а автоподбор высоты рендерит только
    PowerPoint. Без этой оценки блоки наезжают друг на друга.
    """
    per_line = max(1, int((width_in * 72) / (char_w * size)))
    return sum(max(1, math.ceil(len(ln) / per_line)) for ln in text.split("\n"))


def body(slide, text, x=Inches(0.9), y=Inches(2.7), w=Inches(6.0), size=15.5,
         color=BODY, line=1.34, gap_pt=7):
    """Основной текст слайда. Возвращает Y нижней границы блока."""
    parts = [p for p in text.split("\n") if p.strip()]
    line_h = size * line * LINE_F / 72.0
    n = sum(est_lines(p, Emu(int(w)).inches, size) for p in parts)
    h = Inches(n * line_h + (gap_pt / 72.0) * len(parts))
    tf = textbox(slide, x, y, w, h)
    for i, p in enumerate(parts):
        para(tf, p, size, color, line=line, space_after=gap_pt, first=(i == 0))
    return y + h


def bullets(slide, items, x=Inches(0.9), y=Inches(3.4), w=Inches(6.0), size=14.5,
            gap=0.15, line=1.25):
    """Пункты с голубым маркером. Высота каждого — по фактическому переносу."""
    text_w = Emu(int(w) - int(Inches(0.28)))
    line_h = size * line * LINE_F / 72.0
    yy = y
    for item in items:
        h = Inches(est_lines(item, text_w.inches, size) * line_h)
        rect(slide, x, yy + Inches(0.07), Inches(0.1), Inches(0.1), ACCENT)
        tf = textbox(slide, x + Inches(0.28), yy, text_w, h)
        para(tf, item, size, BODY, line=line, first=True)
        yy = yy + h + Inches(gap)
    return yy


def note(slide, text, x=Inches(0.9), y=Inches(6.5), w=Inches(7.0), size=10.5):
    """Мелкая сноска."""
    tf = textbox(slide, x, y, w, Inches(0.6))
    para(tf, text, size, MUTED, line=1.25, first=True)


def stat_card(slide, x, y, w, h, value, label, value_size=25):
    """Карточка с крупной цифрой."""
    card = round_rect(slide, x, y, w, h, BG_LIGHT, adj=0.12)
    card.line.color.rgb = ACCENT_DEEP
    card.line.width = Pt(0.75)
    tf = textbox(slide, x + Inches(0.22), y + Inches(0.26), w - Inches(0.44), Inches(0.5))
    para(tf, value, value_size, WHITE, bold=True, first=True)
    tf2 = textbox(slide, x + Inches(0.22), y + h - Inches(0.62), w - Inches(0.44), Inches(0.45))
    para(tf2, label, 11.5, ACCENT_SOFT, line=1.15, first=True)
    return card
