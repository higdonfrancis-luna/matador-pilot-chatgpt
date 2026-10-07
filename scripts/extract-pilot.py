#!/usr/bin/env python3
"""Build the public Matador homepage seed and presentation template.

This reads a normalized *public-content* extraction and the approved homepage
preview. It intentionally never reads the WordPress XML or WPForms export.
All Sanity document fields below are allowlisted. lxml is the only dependency.
"""
from __future__ import annotations

import argparse
from collections import Counter, OrderedDict
from copy import deepcopy
import json
from pathlib import Path
import re
from urllib.parse import urlparse

from lxml import html


def classes(node):
    return set((node.get("class") or "").split())


def clean(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def text(node):
    copy = deepcopy(node)
    for linebreak in copy.xpath('.//br'):
        linebreak.tail = ' ' + (linebreak.tail or '')
    return clean(copy.text_content())


def safe_url(value):
    value = clean(value)
    return value if urlparse(value).scheme in ("https", "http", "mailto", "tel") or value.startswith(('/', '#')) else ""


def safe_id(value):
    return re.sub(r"[^a-zA-Z0-9_-]", "-", str(value))


def portable_text(fragment):
    """Small semantic HTML -> Portable Text conversion, never raw HTML."""
    root = html.fragment_fromstring(fragment or "", create_parent="div")
    blocks = []

    def emit(node, style="normal", list_item=None, level=1):
        spans, definitions = [], []

        def add(value, marks):
            value = re.sub(r"\s+", " ", value or "")
            if not value:
                return
            if spans and spans[-1]["marks"] == marks:
                spans[-1]["text"] += value
            else:
                spans.append({"_type": "span", "_key": f"s{len(spans)}", "text": value, "marks": list(marks)})

        def inline(el, marks):
            add(el.text, marks)
            for child in el:
                tag = str(child.tag).lower()
                child_marks = list(marks)
                if tag in ("b", "strong"):
                    child_marks.append("strong")
                if tag in ("i", "em"):
                    child_marks.append("em")
                if tag == "a" and safe_url(child.get("href")):
                    mark_key = f"link{len(definitions)}"
                    definitions.append({"_type": "link", "_key": mark_key, "href": safe_url(child.get("href"))})
                    child_marks.append(mark_key)
                if tag == "br":
                    add("\n", marks)
                elif tag not in ("ul", "ol", "script", "style"):
                    inline(child, child_marks)
                add(child.tail, marks)

        inline(node, [])
        if spans:
            spans[0]["text"] = spans[0]["text"].lstrip()
            spans[-1]["text"] = spans[-1]["text"].rstrip()
            spans = [span for span in spans if span["text"]]
        if not spans:
            return
        block = {"_type": "block", "_key": f"p{len(blocks)}", "style": style,
                 "markDefs": definitions, "children": spans}
        if list_item:
            block.update(listItem=list_item, level=level)
        blocks.append(block)

    def visit(node, level=1):
        tag = str(node.tag).lower()
        if tag in ("script", "style"):
            return
        if tag in ("ul", "ol"):
            for child in node:
                if child.tag == "li":
                    emit(child, list_item="bullet" if tag == "ul" else "number", level=level)
                    for nested in child:
                        if nested.tag in ("ul", "ol"):
                            visit(nested, level + 1)
            return
        if tag in ("p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"):
            emit(node, style=tag if tag != "p" else "normal")
            return
        block_children = [x for x in node if x.tag in ("p", "div", "section", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote")]
        if not block_children:
            emit(node)
            return
        # Keep leading/trailing inline fragments around block-level children.
        loose = html.Element("div")
        loose.text = node.text
        for child in node:
            if child in block_children:
                if text(loose):
                    emit(loose)
                loose = html.Element("div")
                visit(child, level)
                loose.text = child.tail
            else:
                loose.append(deepcopy(child))
        if text(loose):
            emit(loose)

    visit(root)
    return blocks


def inner_html(node):
    return (node.text or "") + "".join(html.tostring(child, encoding="unicode") for child in node)


def sanitize(root):
    for node in list(root.iter()):
        if not isinstance(node.tag, str):
            continue
        if node.tag in ("script", "noscript", "object", "embed"):
            node.drop_tree()
            continue
        for key in list(node.attrib):
            if key.lower().startswith("on"):
                del node.attrib[key]
        for key in ("href", "src", "action"):
            if node.get(key) and node.get(key).lower().lstrip().startswith("javascript:"):
                del node.attrib[key]


def reference(doc_id, index):
    return {"_type": "reference", "_ref": doc_id, "_key": f"r{index}"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--content", type=Path, required=True)
    parser.add_argument("--template", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "data")
    args = parser.parse_args()
    source = json.loads(args.content.read_text())
    page = html.parse(str(args.template))
    body = page.find("body")
    sanitize(body)
    for node in list(body.iter()):
        if "preview-review-bar" in classes(node):
            node.drop_tree()

    docs = OrderedDict()

    def save(doc):
        if doc["_id"] not in docs:
            docs[doc["_id"]] = doc
        return doc["_id"]

    def testimonials(items):
        refs = []
        for item in items:
            doc_id = f"testimonial-wp{item['id']}"
            save({"_id": doc_id, "_type": "testimonial", "name": clean(item.get("name") or item.get("title")),
                  "firm": clean(item.get("firm")), "quote": clean(item.get("quote") or item.get("excerpt")),
                  "logoUrl": safe_url(item.get("logo") or item.get("thumbnail")),
                  "photoUrl": safe_url(item.get("photo") or (item.get("client_image") or {}).get("url"))})
            refs.append(reference(doc_id, len(refs)))
        return refs

    home = {"_id": "homePage", "_type": "homePage", "title": "Matador Solutions Homepage",
            "heroTitle": clean(source["hero"]["title"]), "heroBody": portable_text(source["hero"]["html"]),
            "seoTitle": "Legal SEO Marketing Services | Matador Solutions",
            "seoDescription": clean(source["hero"]["text"]), "sections": []}
    home["heroTestimonials"] = testimonials(source["hero_testimonials"])
    home["footerTestimonials"] = testimonials(source["footer_testimonials"])
    home["firmExperiences"] = []
    for item in source["testimonial_slides"]:
        doc_id = f"testimonial-firm{safe_id(item['_id'])}"
        save({"_id": doc_id, "_type": "testimonial", "name": clean(item.get("name")),
              "firm": clean(item.get("title")), "quote": clean(item.get("content")),
              "logoUrl": "", "photoUrl": safe_url((item.get("image") or {}).get("url"))})
        home["firmExperiences"].append(reference(doc_id, len(home["firmExperiences"])))

    home["memberVideos"] = []
    for item in source["videos"]:
        fields = item.get("acf") or {}
        doc_id = f"memberVideo-wp{item['id']}"
        save({"_id": doc_id, "_type": "memberVideo", "firmName": clean(item.get("firm_name") or fields.get("firm_name")),
              "practiceArea": clean(fields.get("practice_areas")), "quote": clean(fields.get("reviewer_quote")),
              "reviewer": clean(fields.get("reviewer_name")), "youtubeUrl": safe_url(item.get("youtube") or fields.get("youtube_url")),
              "thumbnailUrl": safe_url(item.get("thumbnail")), "sourceUrl": safe_url(item.get("url"))})
        home["memberVideos"].append(reference(doc_id, len(home["memberVideos"])))

    home["caseStudies"] = []
    for item in source["case_studies"]:
        fields = item.get("acf") or {}
        doc_id = f"caseStudy-wp{item['id']}"
        save({"_id": doc_id, "_type": "caseStudy", "title": clean(item.get("title")),
              "slug": {"_type": "slug", "current": item["slug"]}, "metric": clean(fields.get("excerpt_count")),
              "summary": clean(item.get("excerpt")), "services": [clean(x) for x in fields.get("service_tag", "").split(",") if clean(x)],
              "imageUrl": safe_url(item.get("thumbnail")), "sourceUrl": safe_url(item.get("url"))})
        home["caseStudies"].append(reference(doc_id, len(home["caseStudies"])))

    home["resources"] = []
    for item in source["resources"]:
        doc_id = f"resource-wp{item['id']}"
        save({"_id": doc_id, "_type": "resource", "title": clean(item.get("title")),
              "imageUrl": safe_url(item.get("thumbnail")), "sourceUrl": safe_url(item.get("url"))})
        home["resources"].append(reference(doc_id, len(home["resources"])))

    for category, src_name, field in (("client", "client_logos", "clientLogos"), ("press", "press_logos", "pressLogos")):
        home[field] = []
        for item in source[src_name]:
            doc_id = f"logo-{category}-wp{item['id']}"
            save({"_id": doc_id, "_type": "logo", "title": clean(item.get("title")), "category": category,
                  "imageUrl": safe_url(item.get("url")), "alt": clean(item.get("alt") or item.get("title"))})
            home[field].append(reference(doc_id, len(home[field])))

    sections = OrderedDict()
    section_names = {
        "12213f0": "Desktop header", "842aeea": "Mobile header", "38d253e": "Hero",
        "eaf14fe": "Featured media", "a64be7c": "Member testimonials", "a0aecab": "What we do",
        "65f974c": "Marketing service tabs", "03b0ff8": "Search engine optimization",
        "43ca852": "Website development", "fc32797": "Local Services Ads", "d1302b0": "Additional services",
        "e49e490": "About Matador heading", "baf7056": "About Matador", "11068e8": "Co-op overview",
        "9d3ae26": "Case studies and marketing audit", "c47cba5": "Why Matador heading",
        "578b84d": "Co-op benefits", "1509ce9": "Membership benefits", "7afc065": "Firm experiences heading",
        "c9d65e0": "Member return on investment", "999eb9f": "The team", "c7f6217": "Guides and resources",
        "d5bc620": "Footer consultation and contact", "f5b4fd6": "Footer featured media", "c3bf6ac": "Footer copyright and policies",
    }
    used_bindings = {}
    identity_counts = Counter()
    hero_ids = {"2cddf35", "8699402"}
    for node in body.iter():
        ancestors = list(node.iterancestors())
        if any("swiper-wrapper" in classes(a) or a.tag == "form" for a in ancestors):
            continue
        if any(a.get("data-id") in hero_ids for a in [node] + ancestors):
            continue
        cls = classes(node)
        kind = None
        if "elementor-widget-container" in cls and any("elementor-widget-text-editor" in classes(a) for a in ancestors[:1]):
            kind = "richText"
        elif "elementor-button" in cls and node.tag == "a":
            kind = "link"
        elif cls.intersection({"elementor-heading-title", "elementor-icon-box-title", "elementor-icon-box-description", "elementor-icon-list-text", "elementor-tab-title"}):
            kind = "text"
        if not kind or not text(node):
            continue
        if any(a.get("data-content-key") for a in ancestors):
            continue
        owner = next((a for a in [node] + ancestors if a.get("data-id")), None)
        section = next((a for a in [node] + ancestors if "elementor-top-section" in classes(a) or "e-parent" in classes(a)), None)
        section_id = section.get("data-id", "global") if section is not None else "global"
        owner_id = owner.get("data-id", "global") if owner is not None else "global"
        # Desktop/mobile service tab titles use a single shared Sanity binding.
        tab_id = node.get("data-tab") if "elementor-tab-title" in cls else None
        duplicate_id = f"{owner_id}-tab-{tab_id}" if tab_id else None
        if duplicate_id and duplicate_id in used_bindings:
            node.set("data-content-key", used_bindings[duplicate_id])
            continue
        identity = f"{owner_id}-{kind}"
        identity_counts[identity] += 1
        binding = f"{identity}-{identity_counts[identity]}"
        node.set("data-content-key", binding)
        if duplicate_id:
            used_bindings[duplicate_id] = binding
        if section_id not in sections:
            headings = section.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," elementor-heading-title ")]') if section is not None else []
            label = next((text(h) for h in headings if text(h) and not any("swiper-wrapper" in classes(a) for a in h.iterancestors())), "")
            label = section_names.get(section_id, label)
            sections[section_id] = {"_type": "homeSection", "_key": f"section-{section_id}",
                                    "title": (label or "Header and navigation" if section_id == "global" else label or "Page section")[:100], "blocks": []}
        block = {"_type": "contentBlock", "_key": binding, "label": text(node)[:100], "key": binding, "kind": kind}
        if kind == "richText":
            block["body"] = portable_text(inner_html(node))
        else:
            block["text"] = text(node)
        if kind == "link":
            block["href"] = safe_url(node.get("href"))
        sections[section_id]["blocks"].append(block)

    home["sections"] = list(sections.values())
    docs = OrderedDict([(home["_id"], home), *docs.items()])
    allowed_fields = {
        "homePage": {"_id", "_type", "title", "heroTitle", "heroBody", "seoTitle", "seoDescription", "sections", "heroTestimonials", "footerTestimonials", "firmExperiences", "memberVideos", "caseStudies", "resources", "clientLogos", "pressLogos"},
        "testimonial": {"_id", "_type", "name", "firm", "quote", "logoUrl", "photoUrl"},
        "memberVideo": {"_id", "_type", "firmName", "practiceArea", "quote", "reviewer", "youtubeUrl", "thumbnailUrl", "sourceUrl"},
        "caseStudy": {"_id", "_type", "title", "slug", "metric", "summary", "services", "imageUrl", "sourceUrl"},
        "resource": {"_id", "_type", "title", "imageUrl", "sourceUrl"},
        "logo": {"_id", "_type", "title", "category", "imageUrl", "alt"},
    }
    for document in docs.values():
        assert set(document) <= allowed_fields[document["_type"]]
    for field in ("heroTestimonials", "footerTestimonials", "firmExperiences", "memberVideos", "caseStudies", "resources", "clientLogos", "pressLogos"):
        assert all(ref["_ref"] in docs for ref in home[field])

    styles = []
    for node in page.find("head"):
        if node.tag == "style" or (node.tag == "link" and node.get("rel") == "stylesheet" and "preview.css" not in node.get("href", "")):
            copy = deepcopy(node)
            sanitize(copy)
            styles.append(html.tostring(copy, encoding="unicode"))
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "pilot.json").write_text(json.dumps(list(docs.values()), indent=2, ensure_ascii=False) + "\n")
    (args.output / "pilot.ndjson").write_text("".join(json.dumps(doc, ensure_ascii=False) + "\n" for doc in docs.values()))
    (args.output / "home-template.html").write_text(inner_html(body))
    (args.output / "style-head.html").write_text("\n".join(styles))
    (args.output / "body-class.txt").write_text(body.get("class", "") + "\n")
    print(json.dumps({"documents": len(docs), "types": dict(Counter(doc["_type"] for doc in docs.values())),
                      "sections": len(home["sections"]), "blocks": sum(len(x["blocks"]) for x in home["sections"]),
                      "output": str(args.output)}, indent=2))


if __name__ == "__main__":
    main()
