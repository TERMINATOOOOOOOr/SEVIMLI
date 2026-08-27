# -*- coding: utf-8 -*-
"""Сборка питч-дека SEVIMLI в .pptx по шаблону President Tech Award.

Запуск:  python build.py
Вывод:   C:/Users/LOQ/Desktop/SEVIMLI_pitch_deck.pptx
"""

import sys
from pathlib import Path

from pptx import Presentation

from theme import SLIDE_W, SLIDE_H
from layouts import (
    slide_title, slide_text_cards, slide_competitors, slide_biz,
    slide_timeline, slide_team, slide_contacts,
)
import content as C

OUT = Path(r"C:/Users/LOQ/Desktop/SEVIMLI_pitch_deck.pptx")


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_title(prs, C.TITLE)                                              # 01
    slide_text_cards(prs, "02", C.PROBLEM, C.PROBLEM_CARDS, "РЫНОК ГОВОРИТ")   # 02
    slide_text_cards(prs, "03", C.SOLUTION)                                # 03
    slide_text_cards(prs, "04", C.AUDIENCE, C.AUDIENCE_CARDS, "РАЗМЕР РЫНКА")  # 04
    slide_competitors(prs, C.COMPETITORS)                                  # 05
    slide_text_cards(prs, "06", C.MONETIZATION)                            # 06
    slide_biz(prs, C.BIZ)                                                  # 07
    slide_timeline(prs, C.MILESTONES)                                      # 08
    slide_team(prs, C.TEAM)                                                # 09
    slide_contacts(prs, C.CONTACTS)                                        # 10

    OUT.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(OUT))
    print(f"OK: {OUT}  ({len(prs.slides.__iter__.__self__._sldIdLst)} слайдов)")


if __name__ == "__main__":
    try:
        build()
    except Exception as e:
        print(f"FAIL: {type(e).__name__}: {e}", file=sys.stderr)
        raise
