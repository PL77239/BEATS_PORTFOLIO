#!/usr/bin/env python3
"""
Generate a clean, professional version of the Poland-Importers.com commercial
offer to the Egyptian Chemical & Fertilizers Export Council.

TEXT-INTEGRITY RULE
-------------------
The wording, phrases, names, numbers and spellings are reproduced *verbatim*
from the reference document ``offer_Egypt_1_reference.pdf`` (the file the client
refers to as "offer Egypt 1.pdf"). Nothing is paraphrased, corrected or added.
This means intentional-looking source quirks are preserved on purpose, e.g.:

  * "Mariott", "multiindustrial", "hecavalent", "Utilize", "analysing";
  * lowercase "polish"; "IVA" (not VAT);
  * European number style "24.000 Euro", "1500 Euro/day", "100ppm";
  * spelled-out sizes "two hundred m2" / "three hundred m2";
  * ranges written with a hyphen ("10-20", "130-150").

Only *layout* is applied (cover page, coloured section bars, bullets, tables) —
per the Polish designer notes that were in the earlier draft. Two source
artifacts are handled as noted in README.md:
  * the duplicated + truncated "Deliverables" heading is shown once (the
    complete list);
  * stray empty bullets / lone "." lines and the manual "-- x of 10 --" page
    markers are omitted (they are pagination/editing noise, not content).

Run:  python3 build_offer.py
Out:  offer_Egypt_Poland_trade_mission.pdf
"""

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register a Unicode font so Polish diacritics (e.g. the "z" with dot in
# "Elzbieta") render correctly; Helvetica has no glyph for them. Used only for
# the affected name so the rest of the document keeps its Arial-like look.
_DEJAVU = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
if os.path.exists(_DEJAVU):
    pdfmetrics.registerFont(TTFont("DejaVu", _DEJAVU))
    UNI = "DejaVu"
else:  # pragma: no cover - fallback if the font is unavailable
    UNI = "Helvetica"

# "Elzbieta" with the correct Polish z-with-dot-above (U+017C), rendered in the
# Unicode font so the glyph is not dropped.
ELZBIETA = f'<font name="{UNI}">El\u017cbieta</font>'
from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    Frame,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    NextPageTemplate,
    PageBreak,
)

HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "assets", "poland-importers-logo.png")
OUT = os.path.join(HERE, "offer_Egypt_Poland_trade_mission.pdf")

# ---------------------------------------------------------------- palette ----
BLUE = colors.HexColor("#0A4C93")   # logo deep blue
BLUE_DARK = colors.HexColor("#073561")
ORANGE = colors.HexColor("#E0801E")  # logo orange
INK = colors.HexColor("#222222")
GREY = colors.HexColor("#5C6670")
LIGHT = colors.HexColor("#EDF1F6")   # pale blue-grey fill
LIGHTER = colors.HexColor("#F6F8FB")
LINE = colors.HexColor("#C9D3DF")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

# Orange filled square bullet using the built-in ZapfDingbats font ('n').
SQ = '<font name="ZapfDingbats" color="#E0801E" size=8>n</font>'


def bullet(txt):
    return f"{SQ}&nbsp;&nbsp;{txt}"


# ----------------------------------------------------------------- styles ----
styles = {}
styles["body"] = ParagraphStyle(
    "body", fontName="Helvetica", fontSize=10, leading=15,
    textColor=INK, alignment=TA_JUSTIFY, spaceAfter=6,
)
styles["sub"] = ParagraphStyle(
    "sub", fontName="Helvetica-Bold", fontSize=12, leading=16,
    textColor=BLUE, spaceBefore=12, spaceAfter=6,
)
styles["mini"] = ParagraphStyle(
    "mini", fontName="Helvetica-Bold", fontSize=10.5, leading=14,
    textColor=BLUE_DARK, spaceBefore=8, spaceAfter=3,
)
styles["li"] = ParagraphStyle(
    "li", parent=styles["body"], alignment=0, spaceAfter=3,
)
styles["li_sub"] = ParagraphStyle(
    "li_sub", parent=styles["li"], fontSize=9.5, leading=14,
    textColor=colors.HexColor("#333333"),
)
styles["note"] = ParagraphStyle(
    "note", fontName="Helvetica-Oblique", fontSize=9, leading=13, textColor=GREY,
)

# cover styles
styles["c_title"] = ParagraphStyle(
    "c_title", fontName="Helvetica-Bold", fontSize=30, leading=34,
    textColor=BLUE, alignment=TA_CENTER,
)
styles["c_lbl"] = ParagraphStyle(
    "c_lbl", fontName="Helvetica-Bold", fontSize=8.5, leading=12,
    textColor=ORANGE,
)
styles["c_val"] = ParagraphStyle(
    "c_val", fontName="Helvetica", fontSize=10, leading=14, textColor=INK,
)
styles["c_val_b"] = ParagraphStyle(
    "c_val_b", parent=styles["c_val"], fontName="Helvetica-Bold",
)


# -------------------------------------------------------------- flowables ----
def section_bar(num, title):
    """A full-width coloured title bar for a main section (I-V)."""
    numcell = Paragraph(
        f'<font color="white" size=15><b>{num}</b></font>', styles["body"]
    )
    titlecell = Paragraph(
        f'<font color="white" size=13><b>{title}</b></font>', styles["body"]
    )
    inner = Table([[numcell, titlecell]], colWidths=[14 * mm, None])
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), BLUE_DARK),
        ("BACKGROUND", (1, 0), (1, 0), BLUE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("LEFTPADDING", (1, 0), (1, 0), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -1), 2, ORANGE),
    ]))
    return KeepTogether([Spacer(1, 6), inner, Spacer(1, 8)])


def sub_head(txt):
    """Coloured-bullet sub-section heading."""
    return Paragraph(bullet(txt), styles["sub"])


def ordered(items, style, fmt="%s)", start=1):
    return ListFlowable(
        [ListItem(Paragraph(t, style), value=start + i) for i, t in enumerate(items)],
        bulletType="1", bulletFormat=fmt, bulletColor=BLUE_DARK,
        bulletFontName="Helvetica-Bold", leftIndent=18, spaceBefore=0,
    )


def unordered(items, style, char="square", size=6):
    return ListFlowable(
        [ListItem(Paragraph(t, style)) for t in items],
        bulletType="bullet", start=char, bulletColor=ORANGE,
        leftIndent=16, bulletFontSize=size, spaceBefore=0,
    )


# ------------------------------------------------------------- page frame ----
def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BLUE)
    canvas.rect(0, PAGE_H - 6 * mm, PAGE_W, 6 * mm, stroke=0, fill=1)
    canvas.setFillColor(ORANGE)
    canvas.rect(0, PAGE_H - 8 * mm, PAGE_W, 2 * mm, stroke=0, fill=1)
    canvas.setFillColor(BLUE)
    canvas.rect(0, 0, PAGE_W, 6 * mm, stroke=0, fill=1)
    canvas.setFillColor(ORANGE)
    canvas.rect(0, 6 * mm, PAGE_W, 2 * mm, stroke=0, fill=1)
    canvas.restoreState()


def draw_content(canvas, doc):
    canvas.saveState()
    y = PAGE_H - 14 * mm
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.7)
    canvas.line(MARGIN, y, PAGE_W - MARGIN, y)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(BLUE)
    canvas.drawString(MARGIN, y + 3, "POLAND-IMPORTERS.COM")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GREY)
    canvas.drawRightString(
        PAGE_W - MARGIN, y + 3, "Trade mission to Poland and general cooperation"
    )
    fy = 12 * mm
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN, fy, PAGE_W - MARGIN, fy)
    canvas.setFillColor(GREY)
    footer_txt = "Juszczak  \u00b7  05-520 Konstancin Jeziorna, Paderewskiego 56, Poland  \u00b7  md@poland-importers.com"
    canvas.setFont(UNI, 7.5)
    canvas.drawString(MARGIN, fy - 10, "El\u017cbieta ")
    name_w = canvas.stringWidth("El\u017cbieta ", UNI, 7.5)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(MARGIN + name_w, fy - 10, footer_txt)
    canvas.setFillColor(BLUE)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawRightString(PAGE_W - MARGIN, fy - 10, "%d" % doc.page)
    canvas.restoreState()


# ------------------------------------------------------------------ story ----
def build():
    doc = BaseDocTemplate(
        OUT, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=22 * mm, bottomMargin=18 * mm,
        title="Trade mission to Poland and general cooperation",
        author="Poland-Importers.com (Elzbieta Juszczak)",
        subject="Trade mission to Poland and general cooperation",
    )

    cover_frame = Frame(
        MARGIN, 20 * mm, PAGE_W - 2 * MARGIN, PAGE_H - 40 * mm,
        id="cover", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )
    content_frame = Frame(
        MARGIN, 16 * mm, PAGE_W - 2 * MARGIN, PAGE_H - 38 * mm,
        id="content", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    )
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=[cover_frame], onPage=draw_cover),
        PageTemplate(id="content", frames=[content_frame], onPage=draw_content),
    ])

    S = []

    # =========================================================== COVER =====
    S.append(Spacer(1, 12 * mm))
    logo = Image(LOGO, width=72 * mm, height=72 * mm * 319 / 523)
    logo.hAlign = "CENTER"
    S.append(logo)
    S.append(Spacer(1, 18 * mm))
    S.append(Paragraph("Trade mission to Poland", styles["c_title"]))
    S.append(Spacer(1, 16 * mm))

    def kv(label, value, bold=False):
        return [
            Paragraph(label, styles["c_lbl"]),
            Paragraph(value, styles["c_val_b"] if bold else styles["c_val"]),
        ]

    info = Table(
        [
            kv("OFERENT PARTY",
               f"{ELZBIETA} Juszczak, 05-520 Konstancin Jeziorna, Paderewskiego 56<br/>"
               "Poland, IVA PL 5860062977<br/>"
               "Email: md@poland-importers.com, tel. 0048601080490"),
            kv("REQUEST FOR PROPOSAL FROM",
               "Mr Yahia EL Menshawy, MBA<br/>Business Development and International cooperation manager<br/>"
               "Chemical &amp; Fertilizers Export Council<br/>Ministry of Investment and Foreign Trade"),
            kv("SUBJECT", "Trade mission to Poland and general cooperation", bold=True),
            kv("COUNTRY OF PERFORMANCE", "Poland", bold=True),
        ],
        colWidths=[46 * mm, None],
    )
    info.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (0, -1), 12),
        ("RIGHTPADDING", (1, 0), (1, -1), 12),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHTER),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ORANGE),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
    ]))
    S.append(info)

    S.append(NextPageTemplate("content"))
    S.append(PageBreak())

    # ===================================================== SECTION I =======
    S.append(section_bar(
        "I", "The mechanism and requirements for organizing a trade mission."))

    S.append(sub_head("Organization Stages"))
    S.append(ordered([
        "Selection of the group of products for the trade mission",
        "Selection of city and time range",
        "Decide duration of the trade mission.",
        "Preparing draft programme of the trade mission and logo",
        "Preparing plan of recruitment of buyers",
        "Preparing the plan of promoting the event, projects of Promotional materials",
        "<b>Substantive preparation (pre-mission)</b> Collecting profiles of potential visitors "
        "(company profile, value proposition, HS codes, partner preferences). Screening of profiles",
        "<b>Execution (in-market).</b> Preparing plan of briefings with the embassy/consul, "
        "one-on-one meetings with pre-selection; site visits; events with local chambers and "
        "associations; often having officials present raises the profile.",
        "<b>Follow-up and evaluation</b> Meeting summaries, sending materials, invitations for second "
        "meetings (including adding additional decision-makers), tracking metrics (number of leads, "
        "qualified contacts, pipeline, deals, qualitative feedback)",
    ], styles["li"], fmt="%s)"))

    S.append(sub_head("Methodology for Identifying and Arranging B2B Meetings"))
    S.append(Paragraph("1. Define Objectives and Participant Profiles", styles["mini"]))
    S.append(unordered([
        "Establish the trade mission's objectives, target sectors, and priority products or services.",
        "Collect detailed profiles of participating companies, including their offerings, production "
        "capacity, import preferences.",
        "Determine each participant's ideal business partner profile (e.g., importer, distributor, "
        "wholesaler, agent, direct buyer).",
    ], styles["li"]))
    S.append(Paragraph("2. Market Research and Partner Identification", styles["mini"]))
    S.append(unordered([
        "Conduct comprehensive market research to identify potential buyers and distribution partners "
        "that match the participants' objectives.",
        "Utilize multiple sources, including:",
    ], styles["li"]))
    S.append(unordered([
        "Industry databases and business directories",
        "Chambers of commerce and trade associations",
        "Government trade and investment agencies",
        "Sector-specific exhibitions and trade fair databases.",
        "Existing business networks and referrals",
        "Professional networking platforms and commercial intelligence tools",
        "Own records",
    ], styles["li_sub"], char="circle"))

    # ===================================================== SECTION II ======
    S.append(section_bar(
        "II", "The expected scope of services, timeline, and deliverables."))

    S.append(sub_head("Timeline"))
    S.append(Paragraph(
        "After deciding the trade mission will take place the following deadlines and core dates "
        "shall be agreed.", styles["body"]))
    S.append(ordered([
        "Deadline to agree date's range for the trade event (assumption is for 2 days event)",
        "Deadline for collect offers of available and suggested places for arrange the trade event.",
        "Deadline for deciding the final dates and place.",
        "The period of 3 months is needed to arrange the event in the best professional way.",
        "The progress of work of the Consultant shall be reported as follows:",
    ], styles["li"], fmt="%s."))
    S.append(unordered([
        "till 4 weeks before the event, once a week",
        "till 1 week before the event, twice a week",
        "last week before the event, every day",
    ], styles["li_sub"], char="circle"))

    S.append(sub_head("Scope of Work and Standards"))
    S.append(Paragraph(
        "In close collaboration with the Ministry the firm will undertake the following tasks for "
        "each trade event:", styles["body"]))
    scope = [
        ("Business Lead Identification",
         "Conduct thorough analysis to pinpoint qualified business leads within. Utilize targeted "
         "marketing campaigns and digital advertising strategies to attract potential leads. Engage in "
         "networking events, trade shows, and industry conferences to establish direct connections with "
         "key decision-makers. Implementing scoring systems to prioritize high-potential prospects based "
         "on predefined criteria set such as company size, industry relevance, and purchasing power. "
         "Collaborate with counterparts in the targeted markets, associations, and chambers of commerce "
         "to gain insights and access to exclusive business directories."),
        ("Capability Assessment for Egyptian companies",
         "Collaborate with the Egyptian teams to review the product portfolios of the selected companies. "
         "This task includes thoroughly analysing the export potential of those companies. Additionally, "
         "it involves pinpointing areas for improvement to better align with the preferences and "
         "regulations of the local polish market and helping to tailor the products to meet the demands "
         "of those markets."),
        ("Buyer List Preparation",
         "The firm will compile a list of prospective buyers, including importers, agents, wholesalers, "
         "direct buyers and, if possible, their company profiles to ensure the list is up-to-date and "
         "relevant to the target markets."),
        ("Orientation session",
         "The consultancy firm will conduct an orientation session for interested Parties (Ministry team, "
         "participants) members to familiarize them with the target market, including consumer "
         "preferences, specifications, certifications, required documents, and market demands."),
        ("Venue Proposal",
         "Suggest appropriate place and time for holding the trade event, considering accessibility and "
         "facilities. Ensure the venue can accommodate the expected number of participants. Coordinate "
         "with the Egyptian team to finalize the venue's setup. Attached is the reference offer of "
         "showrooms/hotel rooms."),
        ("B2B Meeting Arrangement",
         "Schedule high-quality B2B meetings between Egyptian companies and their counterparts in polish "
         "market."),
        ("B2B Meeting Management",
         "Oversee the organization, confirmation, and management of B2B meetings, encompassing buyer "
         "invitations, coordination, and handling. Facilitate meetings to ensure productive interactions."),
        ("Supporting Activities",
         "Carry out additional activities that may ensure the trade event's success, including, but not "
         "limited to, digital marketing, e-commerce activities, orientations, preparatory missions, the "
         "creation of a dedicated website for the trade event, and any other activities contributing to "
         "the mission's success."),
        ("Registration Management Assistance",
         "Help the client manage registrations, including handling buyers' registration, scheduling "
         "walk-in buyers based on time availability, sending reminders to registered buyers, updating the "
         "master schedule."),
        ("Comprehensive Report Preparation",
         "The consultancy firm will draft a detailed report for trade event. The report will encapsulate "
         "the mission's objectives, activities, outcomes, and recommendations for future mission actions, "
         "and an overview of the event, key participants, significant trends, identified opportunities, "
         "and suggestions for future participation in trade events and follow-up activities."),
        ("Buyers feedback",
         "After the trade mission, the consultancy firm should collect and document feedback from the "
         "buyers who attended the trade event as much as possible."),
    ]
    S.append(unordered(
        [f"<b>{h}:</b> {b}" for h, b in scope], styles["li"]))

    S.append(sub_head("Deliverables"))
    S.append(unordered([
        "An initial list of invited participants and their specialization should be submitted three to "
        "four weeks before the trade mission.",
        "In collaboration with the Ministry a verified list of eligible Egyptian companies to participate "
        "in the trade event will be developed. This list should be based on a thorough analysis of each "
        "participating company's capabilities and products.",
        "A PowerPoint presentation for the orientation session that includes consumer preferences, "
        "product specifications, certifications, required documents, and market demands.",
        "A list of suggested venues to hold the export promotion event that will ensure optimum "
        "implementation of the activity, including specifications of the required venue.",
        "A list of critical associations that might support the trade event to be invited to the event.",
        "A detailed list of confirmed buyers attending the trade event and a schedule for the meetings "
        "will be shared with the Ministry one week before the event.",
        "A follow-up matrix with buyers who attended the trade event should include their feedback, the "
        "probability of doing business with Egyptian companies, and any positive or negative aspects of "
        "dealing with Egyptian exporters in general for the Ministry learning purposes.",
    ], styles["li"]))

    # ===================================================== SECTION III =====
    S.append(section_bar("III", "Estimated costs and commercial terms."))

    S.append(sub_head("Costs"))
    S.append(Paragraph("Estimated cost of preparing the trade mission (exclude showroom costs)", styles["body"]))
    S.append(Paragraph("This is based on: 10-20 participants.", styles["li"]))
    S.append(Paragraph("This is based on: 30-40 visitors.", styles["li"]))
    S.append(Spacer(1, 4))
    cost_tbl = Table([
        ["The number of working days for all stages of project", "60 days"],
        ["Fee per day", "400 Euro"],
        ["Total fee", "24.000 Euro"],
    ], colWidths=[None, 42 * mm])
    cost_tbl.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (0, -1), (-1, -1), "Helvetica-Bold", 10.5),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("TEXTCOLOR", (0, -1), (-1, -1), BLUE_DARK),
        ("BACKGROUND", (0, -1), (-1, -1), LIGHT),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
    ]))
    S.append(cost_tbl)
    S.append(Spacer(1, 5))
    S.append(Paragraph(
        "Covers all preparation of the trade mission excluding costs of showroom, hotel rooms, catering, "
        "transfers.", styles["body"]))
    S.append(Paragraph(
        "Detailed schedule of working process and days can be presented for exact project.", styles["body"]))

    S.append(sub_head("Cost of showrooms"))
    S.append(Paragraph(
        "Costs are variable and changeable depending on time when showroom is booked, policy of hotels "
        "and season. Below are examples of current costs:", styles["body"]))
    prod = ParagraphStyle("prod", fontName="Helvetica", fontSize=9.5, leading=13, textColor=INK)
    catp = ParagraphStyle("cat", fontName="Helvetica-Bold", fontSize=9.5, leading=12, textColor=BLUE_DARK)
    show = [
        [Paragraph("Centre of Warsaw", catp)],
        [Paragraph("Hotel Novotel Centrum, space two hundred m2 -1500 Euro/day, catering -1250 Euro/day. "
                   "(estimation for 10-12 exhibitors and forty visitors)", prod)],
        [Paragraph("Hotel NYX by Leonardo, space three hundred m2-3900 Euro/ day, catering-1200 Euro/day. "
                   "((estimation for 10-12 exhibitors and 40 visitors)", prod)],
        [Paragraph("Airport area (out of centre)", catp)],
        [Paragraph("Mariott, space 216 m2 -2800 Euro/day. catering-1000 Euro/day "
                   "((estimation for 10-12 exhibitors and 40 visitors)", prod)],
    ]
    show_tbl = Table(show, colWidths=[None])
    show_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (0, 0), LIGHT),
        ("BACKGROUND", (0, 3), (0, 3), LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ]))
    S.append(show_tbl)

    S.append(sub_head("Cost of hotel rooms"))
    S.append(Paragraph(
        "Average price for single room 130-150 Euro/day, double room-140-160 Euro/day", styles["body"]))

    S.append(sub_head("Commercial terms"))
    S.append(unordered([
        "Showroom and catering are paid by the Council directly; terms of payment usually are. 50% "
        "advance and 50% after the event",
        "Exhibitors pay hotel rooms individually, and we always ask for special rates for participants",
        "Terms of payment for arranging the trade mission: 30% when sign the contract, 30 % before the "
        "event, 40% after the event. These terms are negotiable.",
    ], styles["li"]))

    # ===================================================== SECTION IV ======
    S.append(section_bar("IV", "References-selected"))
    refs = [
        ("AECE Egypt", "arranging trade mission of apparel producers to Poland."),
        ("CLE India", "arranging trade mission of leather goods producers to Poland."),
        ("ITKIB Turkey", "bringing visitors to the fairs Texhibition and Ifco"),
        ("AEPC India", "bringing polish delegation to the fairs."),
        ("EXPOLINK Egypt", "Bringing visitors to the fairs Destination Africa"),
        ("AV-Show Russia", "arranging polish multiindustrial."),
        ("Italian Association of Cosmetic Producers",
         "arranging trade mission of Italian delegates to Poland."),
    ]
    S.append(unordered(
        [f"<b>{h}:</b> {b}" for h, b in refs], styles["li"]))

    # ===================================================== SECTION V =======
    S.append(section_bar("V", "Market requirements for selected products"))
    S.append(Paragraph("We enclose selected product's market requirements.", styles["body"]))
    S.append(Paragraph(
        "Regulation acts of EU can be shared when any project will be planned for selected and specified "
        "group of products. Each group of products has its own regulations and requirements of legal and "
        "official nature and market requirements which can constitute additional one.", styles["body"]))
    S.append(Spacer(1, 4))

    hdr = ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=colors.white)
    catt = ParagraphStyle("catt", fontName="Helvetica-Bold", fontSize=9.5, leading=12, textColor=BLUE_DARK)
    pname = ParagraphStyle("pname", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=INK)
    preq = ParagraphStyle("preq", fontName="Helvetica", fontSize=9, leading=12,
                          textColor=colors.HexColor("#333333"))

    def cat(name):
        return [Paragraph(name, catt), ""]

    def row(p, r):
        return [Paragraph(p, pname), Paragraph(r, preq)]

    data = [
        [Paragraph("IMPORT REQUIREMENTS &amp; REGULATIONS", hdr), ""],
        cat("Raw Materials, Plastics and recyclates"),
        row("Raw PVC, PET, PP", "REACH, SDS, CoA (absence of SVHC)"),
        row("Recycled Plastic, paper, rubber, gas",
            "End-of-Waste Certificate/Permit for international waste shipment, Doc, and EFSA for "
            "food-grade"),
        cat("Packaging"),
        row("Plastic packaging for food",
            "DoC for Food Contact Materials, Overall and Specific Migration Test Reports, GMP Certificate "
            "or proof of compliance"),
        row("Glass bottles, jars, containers",
            "DoC, Lab Test Report for lead and cadmium release, Certificate of Compliance with heavy metal "
            "limits in packaging (sum of lead, cadmium, mercury and hecavalent chromium below 100ppm)"),
        row("Paper packaging",
            "EUDR Due Diligence Statement, DoC for food contact (if applicable), Lab Test Reports (e.g. "
            "for heavy metals, formaldehyde, PCP - depending on intended use"),
        cat("Industrial, Agricultural and Biocidal chemicals"),
        row("Fertilizers",
            "EU Declaration of Conformity (CE), EU Type-Examination Certificate, SDS"),
        row("Insecticides, rodenticides, fungicides",
            "SDS, Approved product label, MRiRW permit (Poland agricultural), Biocidal Product "
            "Authorization (Poland home/industrial)"),
        row("Disinfectants, anti-corrosion agents",
            "Biocidal Product Authorization from URPL, SDS with CLP classification, Proof of Poison Centre "
            "Notification (PCN)"),
        row("Paints and varnishes", "SDS, VOC, PCN"),
        row("Industrial salts / inorganic salts and halides",
            "SDS, (FOR PRECURSOR SALTS): End-User Declaration and importer's registration in the relevant "
            "national tracking system"),
        cat("Specialized Products"),
        row("Medical and laboratory plasticware",
            "MDR: CE, ISO 13485, Notification to the Polish URPL, registration in EUDAMED. IVDR: CE (IVDR) "
            "notified body certificates. General equipment: General Product Safety declaration/Technical "
            "documentation"),
        row("Tires and inner tubes",
            "E-mark (Type Approval Certificate), EU Tyre Label generated from EPREL, Laboratory Test "
            "Report for PAHs (REACH requirement)"),
    ]
    tbl = Table(data, colWidths=[52 * mm, None], repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("SPAN", (0, 0), (-1, 0)),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("LINEBELOW", (0, 0), (-1, 0), 1.2, ORANGE),
    ]
    for i, rrow in enumerate(data):
        if i > 0 and rrow[1] == "":  # category row
            style.append(("SPAN", (0, i), (-1, i)))
            style.append(("BACKGROUND", (0, i), (-1, i), LIGHT))
    tbl.setStyle(TableStyle(style))
    S.append(tbl)

    doc.build(S)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
