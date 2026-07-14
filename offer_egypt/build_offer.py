#!/usr/bin/env python3
"""
Generate a clean, professional version of the Poland-Importers.com commercial
offer to the Egyptian Chemical & Fertilizers Export Council.

The source document mixed final content with Polish layout notes left for the
designer (e.g. "TU DAJ KROPKA ALBO INNY PUNKTOR" = "put a dot / bullet here",
"TU DAJ TAKI LAYOUT JAK PALLADIUM STR 1" = "give it a cover-page layout like
Palladium, page 1"). Those notes are instructions, not content, so they are
removed here and their intent is applied to the layout:

  * page 1 is a proper cover page that keeps the company logo;
  * every main section (I-V) is introduced by a coloured title bar;
  * every sub-section heading is marked with a coloured bullet;
  * lists, cost figures and the import-requirements matrix are cleanly typeset.

Run:  python3 build_offer.py
Out:  offer_Egypt_Poland_trade_mission.pdf
"""

import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
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
    FrameBreak,
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
styles["body_l"] = ParagraphStyle(
    "body_l", parent=styles["body"], alignment=0,
)
styles["lead"] = ParagraphStyle(
    "lead", parent=styles["body"],
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
    "li_sub", parent=styles["li"], fontSize=9.5, leading=14, textColor=colors.HexColor("#333333"),
)
styles["note"] = ParagraphStyle(
    "note", fontName="Helvetica-Oblique", fontSize=9, leading=13, textColor=GREY,
)

# cover styles
styles["c_kicker"] = ParagraphStyle(
    "c_kicker", fontName="Helvetica-Bold", fontSize=11, leading=15,
    textColor=ORANGE, alignment=TA_CENTER, spaceAfter=2,
)
styles["c_title"] = ParagraphStyle(
    "c_title", fontName="Helvetica-Bold", fontSize=30, leading=34,
    textColor=BLUE, alignment=TA_CENTER,
)
styles["c_sub"] = ParagraphStyle(
    "c_sub", fontName="Helvetica", fontSize=14, leading=19,
    textColor=GREY, alignment=TA_CENTER,
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
    inner = Table(
        [[numcell, titlecell]], colWidths=[14 * mm, None]
    )
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


def make_list(items, style, start=None, bullet_char=None):
    kwargs = dict(
        leftIndent=16, bulletFontName="Helvetica", bulletFontSize=style.fontSize,
    )
    if start is not None:  # ordered
        return ListFlowable(
            [ListItem(Paragraph(t, style), value=start + i) for i, t in enumerate(items)],
            bulletType="1", bulletFormat="%s)", bulletColor=BLUE_DARK,
            bulletFontName="Helvetica-Bold", leftIndent=18, spaceBefore=0,
        )
    # unordered
    return ListFlowable(
        [ListItem(Paragraph(t, style)) for t in items],
        bulletType="bullet", start=bullet_char or "square",
        bulletColor=ORANGE, leftIndent=16, bulletFontSize=6, spaceBefore=0,
    )


# ------------------------------------------------------------- page frame ----
def draw_cover(canvas, doc):
    canvas.saveState()
    # top and bottom accent bands
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
    # header rule with small logo mark
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
        PAGE_W - MARGIN, y + 3, "Trade Mission to Poland \u2014 Commercial Proposal"
    )
    # footer
    fy = 12 * mm
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN, fy, PAGE_W - MARGIN, fy)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GREY)
    canvas.drawString(
        MARGIN, fy - 10,
        "Elzbieta Juszczak  \u00b7  Paderewskiego 56, 05-520 Konstancin-Jeziorna, Poland  \u00b7  md@poland-importers.com",
    )
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
        title="Commercial Proposal \u2014 Trade Mission to Poland",
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

    S = []  # story

    # =========================================================== COVER =====
    S.append(Spacer(1, 10 * mm))
    logo = Image(LOGO, width=70 * mm, height=70 * mm * 319 / 523)
    logo.hAlign = "CENTER"
    S.append(logo)
    S.append(Spacer(1, 16 * mm))
    S.append(Paragraph("COMMERCIAL PROPOSAL", styles["c_kicker"]))
    S.append(Spacer(1, 2 * mm))
    S.append(Paragraph("Trade Mission to Poland", styles["c_title"]))
    S.append(Spacer(1, 3 * mm))
    S.append(Paragraph("Organisation of a trade mission &amp; general cooperation", styles["c_sub"]))
    S.append(Spacer(1, 14 * mm))

    def kv(label, value, bold=False):
        return [
            Paragraph(label, styles["c_lbl"]),
            Paragraph(value, styles["c_val_b"] if bold else styles["c_val"]),
        ]

    info = Table(
        [
            kv("OFFERING PARTY",
               "Elzbieta Juszczak<br/>Paderewskiego 56, 05-520 Konstancin-Jeziorna, Poland<br/>"
               "VAT: PL 5860062977<br/>md@poland-importers.com &nbsp;\u00b7&nbsp; +48 601 080 490"),
            kv("PREPARED FOR",
               "Mr Yahia El Menshawy, MBA<br/>Business Development &amp; International Cooperation Manager<br/>"
               "Chemical &amp; Fertilizers Export Council<br/>Ministry of Investment and Foreign Trade"),
            kv("SUBJECT", "Trade mission to Poland and general cooperation", bold=True),
            kv("COUNTRY OF PERFORMANCE", "Poland", bold=True),
        ],
        colWidths=[42 * mm, None],
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
        "I", "The Mechanism and Requirements for Organizing a Trade Mission"))

    S.append(sub_head("Organization Stages"))
    S.append(make_list([
        "Selection of the group of products for the trade mission.",
        "Selection of the city and time range.",
        "Deciding the duration of the trade mission.",
        "Preparing a draft programme of the trade mission and the logo.",
        "Preparing a plan for the recruitment of buyers.",
        "Preparing the plan for promoting the event, including drafts of promotional materials.",
        "<b>Substantive preparation (pre-mission)</b> &mdash; collecting profiles of potential visitors "
        "(company profile, value proposition, HS codes, partner preferences) and screening of profiles.",
        "<b>Execution (in-market)</b> &mdash; preparing a plan of briefings with the embassy/consulate, "
        "one-on-one meetings with pre-selected partners, site visits, and events with local chambers and "
        "associations. Having officials present often raises the profile of the event.",
        "<b>Follow-up and evaluation</b> &mdash; meeting summaries, sending materials, invitations for second "
        "meetings (including additional decision-makers), and tracking metrics (number of leads, qualified "
        "contacts, pipeline, deals, and qualitative feedback).",
    ], styles["li"], start=1))

    S.append(sub_head("Methodology for Identifying and Arranging B2B Meetings"))
    S.append(Paragraph("<b>1. Define objectives and participant profiles</b>", styles["mini"]))
    S.append(make_list([
        "Establish the trade mission's objectives, target sectors, and priority products or services.",
        "Collect detailed profiles of participating companies, including their offerings, production "
        "capacity, and import preferences.",
        "Determine each participant's ideal business-partner profile (e.g., importer, distributor, "
        "wholesaler, agent, or direct buyer).",
    ], styles["li"]))
    S.append(Paragraph("<b>2. Market research and partner identification</b>", styles["mini"]))
    S.append(make_list([
        "Conduct comprehensive market research to identify potential buyers and distribution partners "
        "that match the participants' objectives.",
        "Utilise multiple sources, including those listed below.",
    ], styles["li"]))
    S.append(make_list([
        "Industry databases and business directories",
        "Chambers of commerce and trade associations",
        "Government trade and investment agencies",
        "Sector-specific exhibitions and trade-fair databases",
        "Existing business networks and referrals",
        "Professional networking platforms and commercial intelligence tools",
        "The firm's own records",
    ], styles["li_sub"], bullet_char="circle"))

    # ===================================================== SECTION II ======
    S.append(section_bar(
        "II", "Expected Scope of Services, Timeline, and Deliverables"))

    S.append(sub_head("Timeline"))
    S.append(Paragraph(
        "Once the decision to hold the trade mission has been taken, the following deadlines and "
        "core dates shall be agreed:", styles["body"]))
    S.append(make_list([
        "Deadline to agree the date range for the trade event (assumed to be a two-day event).",
        "Deadline to collect offers of available and suggested venues for the trade event.",
        "Deadline to decide the final dates and venue.",
        "A period of three months is required to arrange the event to the highest professional standard.",
        "The Consultant's progress shall be reported as set out below.",
    ], styles["li"], start=1))
    S.append(make_list([
        "Until four weeks before the event &mdash; once a week",
        "Until one week before the event &mdash; twice a week",
        "During the last week before the event &mdash; every day",
    ], styles["li_sub"], bullet_char="circle"))

    S.append(sub_head("Scope of Work and Standards"))
    S.append(Paragraph(
        "In close collaboration with the Ministry, the firm will undertake the following tasks for "
        "each trade event:", styles["body"]))
    scope = [
        ("Business Lead Identification",
         "Conduct thorough analysis to pinpoint qualified business leads within the target market. Use "
         "targeted marketing campaigns and digital advertising strategies to attract potential leads; engage "
         "in networking events, trade shows, and industry conferences to establish direct connections with key "
         "decision-makers; and implement scoring systems to prioritise high-potential prospects against "
         "predefined criteria such as company size, industry relevance, and purchasing power. Collaborate with "
         "counterparts in the target markets, associations, and chambers of commerce to gain insights and "
         "access to exclusive business directories."),
        ("Capability Assessment for Egyptian Companies",
         "Collaborate with the Ministry's teams to review the product portfolios of the selected companies. "
         "This includes a thorough analysis of their export potential and pinpointing areas for improvement to "
         "better align with the preferences and regulations of the local Polish market, helping to tailor the "
         "products to meet market demands."),
        ("Buyer List Preparation",
         "Compile a list of prospective buyers &mdash; importers, agents, wholesalers, and direct buyers &mdash; "
         "and, where possible, their company profiles, ensuring the list is up-to-date and relevant to the "
         "target markets."),
        ("Orientation Session",
         "Conduct an orientation session for interested parties (the Ministry's team and participants) to "
         "familiarise them with the target market, including consumer preferences, specifications, "
         "certifications, required documents, and market demands."),
        ("Venue Proposal",
         "Suggest an appropriate venue and time for holding the trade event, considering accessibility and "
         "facilities, and ensuring the venue can accommodate the expected number of participants. Coordinate "
         "with the Ministry's team to finalise the venue setup. A reference offer of showrooms / hotel rooms is "
         "attached."),
        ("B2B Meeting Arrangement",
         "Schedule high-quality B2B meetings between Egyptian companies and their counterparts in the Polish "
         "market."),
        ("B2B Meeting Management",
         "Oversee the organisation, confirmation, and management of B2B meetings, including buyer invitations, "
         "coordination, and handling, and facilitate the meetings to ensure productive interactions."),
        ("Supporting Activities",
         "Carry out additional activities that may ensure the trade event's success, including but not limited "
         "to digital marketing, e-commerce activities, orientations, preparatory missions, and the creation of "
         "a dedicated website for the trade event."),
        ("Registration Management Assistance",
         "Help the client manage registrations, including handling buyers' registration, scheduling walk-in "
         "buyers based on availability, sending reminders to registered buyers, and updating the master "
         "schedule."),
        ("Comprehensive Report Preparation",
         "Draft a detailed report for the trade event covering the mission's objectives, activities, outcomes, "
         "and recommendations for future actions, together with an overview of the event, key participants, "
         "significant trends, identified opportunities, and suggestions for future participation and follow-up."),
        ("Buyer Feedback",
         "After the trade mission, collect and document feedback from the buyers who attended the event, as "
         "fully as possible."),
    ]
    S.append(make_list(
        [f"<b>{h}.</b> {b}" for h, b in scope], styles["li"]))

    S.append(sub_head("Deliverables"))
    S.append(make_list([
        "An initial list of invited participants and their specialisation, to be submitted approximately "
        "three to four weeks before the trade mission.",
        "In collaboration with the Ministry, a verified list of eligible Egyptian companies to participate in "
        "the trade event, based on a thorough analysis of each company's capabilities and products.",
        "A presentation for the orientation session covering consumer preferences, product specifications, "
        "certifications, required documents, and market demands.",
        "A list of suggested venues for the export-promotion event that will ensure optimal implementation of "
        "the activity, including the specifications of the required venue.",
        "A list of key associations that might support the trade event and could be invited.",
        "A detailed list of confirmed buyers attending the trade event and a schedule of meetings, to be "
        "shared with the Ministry one week before the event.",
        "A follow-up matrix of the buyers who attended, including their feedback, the probability of doing "
        "business with Egyptian companies, and any positive or negative aspects of dealing with Egyptian "
        "exporters in general, for the Ministry's learning purposes.",
    ], styles["li"]))

    # ===================================================== SECTION III =====
    S.append(section_bar("III", "Estimated Costs and Commercial Terms"))

    S.append(sub_head("Costs"))
    S.append(Paragraph(
        "Estimated cost of preparing the trade mission (excluding showroom costs), based on 10&ndash;20 "
        "participants and 30&ndash;40 visitors:", styles["body"]))
    cost_tbl = Table([
        ["Number of working days (all project stages)", "60 days"],
        ["Fee per day", "EUR 400"],
        ["Total fee", "EUR 24,000"],
    ], colWidths=[None, 45 * mm])
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
    S.append(Spacer(1, 4))
    S.append(Paragraph(
        "This covers all preparation of the trade mission, excluding the costs of the showroom, hotel rooms, "
        "catering, and transfers. A detailed schedule of the working process and days can be presented for a "
        "specific project.", styles["note"]))

    S.append(sub_head("Cost of Showrooms"))
    S.append(Paragraph(
        "Costs are variable and depend on the booking time, hotel policies, and season. The following are "
        "examples of current costs.", styles["body"]))
    show_tbl = Table([
        [Paragraph("<b>Venue</b>", styles["c_val"]),
         Paragraph("<b>Space</b>", styles["c_val"]),
         Paragraph("<b>Space cost</b>", styles["c_val"]),
         Paragraph("<b>Catering</b>", styles["c_val"])],
        ["Centre of Warsaw", "", "", ""],
        ["Hotel Novotel Centrum", "200 m\u00b2", "EUR 1,500/day", "EUR 1,250/day"],
        ["Hotel NYX by Leonardo", "300 m\u00b2", "EUR 3,900/day", "EUR 1,200/day"],
        ["Airport area (outside the centre)", "", "", ""],
        ["Marriott", "216 m\u00b2", "EUR 2,800/day", "EUR 1,000/day"],
    ], colWidths=[None, 24 * mm, 32 * mm, 32 * mm])
    show_tbl.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 9.5),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9.5),
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, 1), LIGHT),
        ("BACKGROUND", (0, 4), (-1, 4), LIGHT),
        ("FONT", (0, 1), (-1, 1), "Helvetica-Bold", 9.5),
        ("FONT", (0, 4), (-1, 4), "Helvetica-Bold", 9.5),
        ("TEXTCOLOR", (0, 1), (0, 1), BLUE_DARK),
        ("TEXTCOLOR", (0, 4), (0, 4), BLUE_DARK),
        ("SPAN", (0, 1), (-1, 1)),
        ("SPAN", (0, 4), (-1, 4)),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("ALIGN", (0, 1), (0, 1), "LEFT"),
        ("ALIGN", (0, 4), (0, 4), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ]))
    S.append(show_tbl)
    S.append(Spacer(1, 3))
    S.append(Paragraph("All showroom estimates assume 10&ndash;12 exhibitors and 40 visitors.", styles["note"]))

    S.append(sub_head("Cost of Hotel Rooms"))
    S.append(make_list([
        "Single room: EUR 130&ndash;150 per day.",
        "Double room: EUR 140&ndash;160 per day.",
    ], styles["li"]))

    S.append(sub_head("Commercial Terms"))
    S.append(make_list([
        "Showroom and catering are paid by the Council directly; payment terms are usually 50% in advance and "
        "50% after the event.",
        "Hotel rooms are paid individually by exhibitors; we always request special rates for participants.",
        "Terms of payment for arranging the trade mission: 30% on signing the contract, 30% before the event, "
        "and 40% after the event. These terms are negotiable.",
    ], styles["li"]))

    # ===================================================== SECTION IV ======
    S.append(section_bar("IV", "Selected References"))
    refs = [
        ("AECE &mdash; Egypt", "Arranging a trade mission of apparel producers to Poland."),
        ("CLE &mdash; India", "Arranging a trade mission of leather-goods producers to Poland."),
        ("ITKIB &mdash; Turkey", "Bringing visitors to the Texhibition and IFCO fairs."),
        ("AEPC &mdash; India", "Bringing a Polish delegation to the fairs."),
        ("EXPOLINK &mdash; Egypt", "Bringing visitors to the Destination Africa fair."),
        ("AV-Show &mdash; Russia", "Arranging a Polish multi-industry delegation / trade mission to Stavropol."),
        ("Italian Association of Cosmetic Producers", "Arranging a trade mission of Italian delegates to Poland."),
    ]
    S.append(make_list(
        [f"<b>{h}</b> &mdash; {b}" for h, b in refs], styles["li"]))

    # ===================================================== SECTION V =======
    S.append(section_bar("V", "Market Requirements for Selected Products"))
    S.append(Paragraph(
        "We enclose the market requirements for selected products. EU regulatory acts can be shared once a "
        "project is planned for a selected and specified group of products. Each product group has its own "
        "regulations and requirements of a legal and official nature, and market requirements may constitute "
        "an additional layer.", styles["body"]))
    S.append(Spacer(1, 4))

    hdr = ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=9.5, leading=12, textColor=colors.white)
    catp = ParagraphStyle("cat", fontName="Helvetica-Bold", fontSize=9.5, leading=12, textColor=BLUE_DARK)
    prod = ParagraphStyle("prod", fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=INK)
    req = ParagraphStyle("req", fontName="Helvetica", fontSize=9, leading=12, textColor=colors.HexColor("#333333"))

    def cat(name):
        return [Paragraph(name, catp), ""]

    def row(p, r):
        return [Paragraph(p, prod), Paragraph(r, req)]

    data = [
        [Paragraph("Product", hdr), Paragraph("Import requirements &amp; regulations", hdr)],
        cat("Raw Materials, Plastics and Recyclates"),
        row("Raw PVC, PET, PP", "REACH, SDS, CoA (absence of SVHC)."),
        row("Recycled plastic, paper, rubber, gas",
            "End-of-Waste Certificate / permit for international waste shipment; DoC and EFSA for food-grade."),
        cat("Packaging"),
        row("Plastic packaging for food",
            "DoC for Food Contact Materials; overall and specific migration test reports; GMP certificate or "
            "proof of compliance."),
        row("Glass bottles, jars, containers",
            "DoC; lab test report for lead and cadmium release; certificate of compliance with heavy-metal "
            "limits in packaging (sum of lead, cadmium, mercury, and hexavalent chromium below 100 ppm)."),
        row("Paper packaging",
            "EUDR Due Diligence Statement; DoC for food contact (if applicable); lab test reports (e.g., for "
            "heavy metals, formaldehyde, PCP), depending on intended use."),
        cat("Industrial, Agricultural and Biocidal Chemicals"),
        row("Fertilizers",
            "EU Declaration of Conformity (CE); EU Type-Examination Certificate; SDS."),
        row("Insecticides, rodenticides, fungicides",
            "SDS; approved product label; MRiRW permit (Polish agricultural); Biocidal Product Authorization "
            "(Polish home / industrial)."),
        row("Disinfectants, anti-corrosion agents",
            "Biocidal Product Authorization from URPL; SDS with CLP classification; proof of Poison Centre "
            "Notification (PCN)."),
        row("Paints and varnishes", "SDS; VOC; PCN."),
        row("Industrial salts / inorganic salts and halides",
            "SDS; for precursor salts, an End-User Declaration and the importer's registration in the relevant "
            "national tracking system."),
        cat("Specialized Products"),
        row("Medical and laboratory plasticware",
            "MDR: CE, ISO 13485, notification to the Polish URPL, registration in EUDAMED. IVDR: CE (IVDR), "
            "notified-body certificates. General equipment: General Product Safety declaration / technical "
            "documentation."),
        row("Tires and inner tubes",
            "E-mark (Type Approval Certificate); EU Tyre Label generated from EPREL; laboratory test report "
            "for PAHs (REACH requirement)."),
    ]
    tbl = Table(data, colWidths=[52 * mm, None], repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("LINEBELOW", (0, 0), (-1, 0), 1.2, ORANGE),
    ]
    for i, rrow in enumerate(data):
        if rrow[1] == "":  # category row
            style.append(("SPAN", (0, i), (-1, i)))
            style.append(("BACKGROUND", (0, i), (-1, i), LIGHT))
    tbl.setStyle(TableStyle(style))
    S.append(tbl)

    doc.build(S)
    print("wrote", OUT)


if __name__ == "__main__":
    build()
