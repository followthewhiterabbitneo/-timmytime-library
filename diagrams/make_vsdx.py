#!/usr/bin/env python3
import math, zipfile, html, os

PAGE_W, PAGE_H = 11.0, 8.5  # inches, landscape

def vy(top_y):  # convert top-origin inches to Visio bottom-origin
    return PAGE_H - top_y

# ---- nodes: id -> dict (top-origin centers) ----
# fill, line, font colors are hex
nodes = {}
def node(id, cx, cy, w, h, text, fill, line, fcolor="#FFFFFF", valign=1, fsize=0.10, fillpat=1):
    nodes[id] = dict(cx=cx, cy=cy, w=w, h=h, text=text, fill=fill, line=line,
                     fcolor=fcolor, valign=valign, fsize=fsize, fillpat=fillpat)

# Containers (drawn first / behind)
node("voice", 5.7, 2.75, 4.6, 1.7, "Cisco Voice Platform",
     "#DAE8FC", "#1BA0D7", "#1B4F72", valign=0, fsize=0.12)
node("orec", 5.25, 6.35, 5.1, 1.9, "Call Recording — OrecX (RHEL 9)",
     "#F8CECC", "#EE0000", "#7B1010", valign=0, fsize=0.12)

# Clients
node("pc",   1.5, 1.0, 2.0, 0.70, "Agent / Supervisor PC\n(browser)", "#455A64", "#263238")
node("phone",5.0, 1.0, 2.0, 0.70, "Cisco IP Phone\n(BIB enabled)", "#1BA0D7", "#0F6E96")

# F5 on the LEFT (web / REST path only)
node("f5",   1.5, 2.6, 2.0, 0.85, "F5 BIG-IP\nVIP / REST API gateway\n(HTTPS) 10.10.20.5", "#E21D38", "#9E1427")

# Voice platform members
node("cucm", 4.6, 2.75, 2.0, 0.95, "Cisco Unified CM (CUCM)\nSIP / SIPREC trunk\n10.10.10.10", "#1BA0D7", "#0F6E96")
node("ctimgr",6.9, 2.75, 1.9, 0.95, "CTI Manager\n(on CUCM)", "#1BA0D7", "#0F6E96")

# JTAPI / CTI connector (middle)
node("ctibox",5.8, 4.4, 2.5, 0.80, "JTAPI / CTI Connector\n(Oreka CTI module)\n10.10.12.20", "#2E7D32", "#1B5E20")

# OrecX members
node("orkaudio",4.0, 6.45, 2.1, 1.0, "OrkAudio\ncapture / recording\nRHEL 9 — 10.10.21.11", "#EE0000", "#A30000")
node("orkui",   6.5, 6.45, 2.1, 1.0, "OrkUI / OrkWeb\nweb UI + REST API\nRHEL 9 — 10.10.21.12", "#EE0000", "#A30000")

# Qumulo storage
node("qumulo", 9.5, 6.3, 1.8, 1.1, "Qumulo Cluster\nNFS /recordings\n10.10.30.0/24", "#5C2D91", "#3B1D5E")

# Title block (no fill)
node("title", 5.5, 0.32, 9.0, 0.40, "Call Recording Architecture — OrecX / CUCM / F5 / Qumulo NFS",
     "#FFFFFF", "#FFFFFF", "#1A1A1A", valign=1, fsize=0.17, fillpat=0)
node("subtitle", 5.5, 0.62, 9.0, 0.24, "CUCM BIB/SIPREC + JTAPI/CTI · F5 REST gateway · OrecX recorders (RHEL 9) · Qumulo NFS   |   v1  2026-06-12",
     "#FFFFFF", "#FFFFFF", "#555555", valign=1, fsize=0.085, fillpat=0)

draw_order = ["voice","orec","title","subtitle","pc","phone","f5","cucm","ctimgr",
              "ctibox","orkaudio","orkui","qumulo"]

# ---- edges ----
edges = [
    ("phone","cucm","SCCP/SIP register + calls", False),
    ("pc","f5","HTTPS / REST API", False),
    ("f5","orkui","REST API (HTTPS)", False),
    ("cucm","orkaudio","SIP / SIPREC media (SRTP)", False),
    ("ctimgr","ctibox","JTAPI (TLS) 2748-2749", True),
    ("ctibox","orkaudio","call events / metadata", True),
    ("orkui","orkaudio","search / playback", False),
    ("orkaudio","qumulo","NFS tcp/2049", False),
]

def border_point(n, tx, ty):
    """point on rect border of node n toward target (tx,ty) in Visio coords"""
    cx, cy = n["cx"], vy(n["cy"])
    dx, dy = tx - cx, ty - cy
    hw, hh = n["w"]/2.0, n["h"]/2.0
    if dx == 0 and dy == 0:
        return cx, cy
    sx = hw/abs(dx) if dx != 0 else float("inf")
    sy = hh/abs(dy) if dy != 0 else float("inf")
    s = min(sx, sy)
    return cx + dx*s, cy + dy*s

def esc(t):
    return html.escape(t).replace("\n", "&#10;")

# ---- build page1 shapes XML ----
shapes_xml = []

def char_section(color, size):
    return (f'<Section N="Character"><Row IX="0">'
            f'<Cell N="Color" V="{color}"/><Cell N="Size" V="{size}"/></Row></Section>')

def rect_geometry():
    return ('<Section N="Geometry" IX="0">'
            '<Cell N="NoFill" V="0"/><Cell N="NoLine" V="0"/>'
            '<Row T="RelMoveTo" IX="1"><Cell N="X" V="0"/><Cell N="Y" V="0"/></Row>'
            '<Row T="RelLineTo" IX="2"><Cell N="X" V="1"/><Cell N="Y" V="0"/></Row>'
            '<Row T="RelLineTo" IX="3"><Cell N="X" V="1"/><Cell N="Y" V="1"/></Row>'
            '<Row T="RelLineTo" IX="4"><Cell N="X" V="0"/><Cell N="Y" V="1"/></Row>'
            '<Row T="RelLineTo" IX="5"><Cell N="X" V="0"/><Cell N="Y" V="0"/></Row>'
            '</Section>')

sid = 1
ids = {}
for key in draw_order:
    n = nodes[key]
    ids[key] = sid
    pinx, piny = n["cx"], vy(n["cy"])
    w, h = n["w"], n["h"]
    s = (f'<Shape ID="{sid}" Type="Shape" Name="{key}">'
         f'<Cell N="PinX" V="{pinx:.4f}"/><Cell N="PinY" V="{piny:.4f}"/>'
         f'<Cell N="Width" V="{w:.4f}"/><Cell N="Height" V="{h:.4f}"/>'
         f'<Cell N="LocPinX" V="{w/2:.4f}" F="Width*0.5"/>'
         f'<Cell N="LocPinY" V="{h/2:.4f}" F="Height*0.5"/>'
         f'<Cell N="FillForegnd" V="{n["fill"]}"/>'
         f'<Cell N="FillPattern" V="{n["fillpat"]}"/>'
         f'<Cell N="LineColor" V="{n["line"]}"/>'
         f'<Cell N="LineWeight" V="0.0104"/>'
         f'<Cell N="VerticalAlign" V="{n["valign"]}"/>'
         f'<Cell N="Para.HorzAlign" V="1"/>'
         + char_section(n["fcolor"], n["fsize"])
         + rect_geometry()
         + f'<Text>{esc(n["text"])}</Text>'
         + '</Shape>')
    shapes_xml.append(s)
    sid += 1

# connectors
for (a, b, label, dashed) in edges:
    na, nb = nodes[a], nodes[b]
    acx, acy = na["cx"], vy(na["cy"])
    bcx, bcy = nb["cx"], vy(nb["cy"])
    bx, by = border_point(na, bcx, bcy)
    ex, ey = border_point(nb, acx, acy)
    length = math.hypot(ex-bx, ey-by)
    angle = math.atan2(ey-by, ex-bx)
    pinx, piny = (bx+ex)/2.0, (by+ey)/2.0
    pat = 2 if dashed else 1
    s = (f'<Shape ID="{sid}" Type="Shape" Name="{a}-{b}">'
         f'<Cell N="PinX" V="{pinx:.4f}"/><Cell N="PinY" V="{piny:.4f}"/>'
         f'<Cell N="Width" V="{length:.4f}"/><Cell N="Height" V="0"/>'
         f'<Cell N="LocPinX" V="{length/2:.4f}" F="Width*0.5"/>'
         f'<Cell N="LocPinY" V="0"/>'
         f'<Cell N="Angle" V="{angle:.6f}"/>'
         f'<Cell N="BeginX" V="{bx:.4f}"/><Cell N="BeginY" V="{by:.4f}"/>'
         f'<Cell N="EndX" V="{ex:.4f}"/><Cell N="EndY" V="{ey:.4f}"/>'
         f'<Cell N="LineColor" V="#555555"/>'
         f'<Cell N="LineWeight" V="0.0138"/>'
         f'<Cell N="LinePattern" V="{pat}"/>'
         f'<Cell N="EndArrow" V="4"/>'
         + char_section("#333333", 0.075)
         + ('<Section N="Geometry" IX="0">'
            '<Cell N="NoFill" V="1"/><Cell N="NoLine" V="0"/>'
            f'<Row T="MoveTo" IX="1"><Cell N="X" V="0"/><Cell N="Y" V="0"/></Row>'
            f'<Row T="LineTo" IX="2"><Cell N="X" V="{length:.4f}" F="Width*1"/><Cell N="Y" V="0"/></Row>'
            '</Section>')
         + f'<Text>{esc(label)}</Text>'
         + '</Shape>')
    shapes_xml.append(s)
    sid += 1

NS = 'http://schemas.microsoft.com/office/visio/2012/main'
RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

page1 = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
         f'<PageContents xmlns="{NS}" xmlns:r="{RNS}" xml:space="preserve">'
         f'<Shapes>{"".join(shapes_xml)}</Shapes></PageContents>')

pages = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
         f'<Pages xmlns="{NS}" xmlns:r="{RNS}" xml:space="preserve">'
         f'<Page ID="0" NameU="Page-1" Name="Page-1" ViewScale="-1" ViewCenterX="{PAGE_W/2}" ViewCenterY="{PAGE_H/2}">'
         f'<PageSheet>'
         f'<Cell N="PageWidth" V="{PAGE_W}"/><Cell N="PageHeight" V="{PAGE_H}"/>'
         f'<Cell N="ShdwOffsetX" V="0.125"/><Cell N="ShdwOffsetY" V="-0.125"/>'
         f'<Cell N="PageScale" V="1"/><Cell N="DrawingScale" V="1"/>'
         f'<Cell N="DrawingSizeType" V="0"/><Cell N="DrawingScaleType" V="0"/>'
         f'<Cell N="InhibitSnap" V="0"/>'
         f'</PageSheet>'
         f'<Rel r:id="rId1"/></Page></Pages>')

document = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            f'<VisioDocument xmlns="{NS}" xmlns:r="{RNS}" xml:space="preserve">'
            f'<DocumentSettings TopPage="0" DefaultTextStyle="0">'
            f'<GlueSettings>9</GlueSettings><SnapSettings>65463</SnapSettings>'
            f'</DocumentSettings>'
            f'<Colors/><FaceNames/><StyleSheets/></VisioDocument>')

ct = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      '<Default Extension="xml" ContentType="application/xml"/>'
      '<Override PartName="/visio/document.xml" ContentType="application/vnd.ms-visio.drawing.main+xml"/>'
      '<Override PartName="/visio/pages/pages.xml" ContentType="application/vnd.ms-visio.pages+xml"/>'
      '<Override PartName="/visio/pages/page1.xml" ContentType="application/vnd.ms-visio.page+xml"/>'
      '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
      '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
      '</Types>')

root_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/document" Target="visio/document.xml"/>'
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>'
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>'
    '</Relationships>')

doc_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/pages" Target="pages/pages.xml"/>'
    '</Relationships>')

pages_rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    '<Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/page" Target="page1.xml"/>'
    '</Relationships>')

core = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
    'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" '
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    '<dc:title>Call Recording Architecture — OrecX / CUCM / F5 / Qumulo NFS</dc:title>'
    '<dc:creator>Architecture</dc:creator>'
    '<dcterms:created xsi:type="dcterms:W3CDTF">2026-06-12T00:00:00Z</dcterms:created>'
    '</cp:coreProperties>')

app = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">'
    '<Application>Microsoft Visio</Application><Company>Architecture</Company></Properties>')

out = "/home/user/-timmytime-library/diagrams/call-recording-architecture.vsdx"
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", ct)
    z.writestr("_rels/.rels", root_rels)
    z.writestr("docProps/core.xml", core)
    z.writestr("docProps/app.xml", app)
    z.writestr("visio/document.xml", document)
    z.writestr("visio/_rels/document.xml.rels", doc_rels)
    z.writestr("visio/pages/pages.xml", pages)
    z.writestr("visio/pages/_rels/pages.xml.rels", pages_rels)
    z.writestr("visio/pages/page1.xml", page1)
print("wrote", out, os.path.getsize(out), "bytes")
