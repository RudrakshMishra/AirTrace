"""Deterministic rule-based municipal actions and citizen advisories.

Generates structured recommendations in English and Hindi based on dominant
pollution sources, confidence levels, ventilation traps, and vulnerability risk.
"""

from __future__ import annotations

from typing import Any


def generate_actions_for_ward(
    ward_id: str,
    city_id: str,
    dominant_source: str,
    source_shares: dict[str, float],
    confidence_score: int,
    is_trap: bool,
    risk_category: str,
    evidence: dict[str, Any],
) -> list[dict[str, Any]]:
    """Generate deterministic municipal and public health actions for a ward.

    Rules defined in CLAUDE.md:
    1. Dominant fire & confidence >= 50:
       - Alert upwind district authorities & advise citizen masks/indoor precautions.
    2. Dominant dust:
       - Mechanized road sweeping, water sprinkling, and cover-norm enforcement.
    3. Dominant traffic & trap flag active:
       - Heavy-vehicle diversions, synchronized traffic signals, public transit boost.
    4. Dominant industry:
       - Inspection of industrial units within 5km upwind, stack emission audits.
    5. High / Critical risk:
       - Prioritize air purifiers and advisories in schools and hospitals.

    Returns:
        List of structured action dicts with department, priority, text_en, text_hi, evidence
    """
    actions: list[dict[str, Any]] = []

    dom_share = source_shares.get(dominant_source, 0.0)

    # 1. Biomass / Agricultural Fire Rules
    if dominant_source == "fire" and confidence_score >= 50:
        fire_count = evidence.get("fire", {}).get("upwind_fire_count", 0)
        actions.append({
            "ward_id": ward_id,
            "city_id": city_id,
            "department": "District Administration / Agriculture Dept",
            "category": "Source Mitigation",
            "priority": "High" if dom_share > 50 else "Medium",
            "title_en": "Upwind Biomass Fire Alert & Farm Stubble Enforcement",
            "title_hi": "हवा के रुख पर पराली/बायोमास आग चेतावनी और कार्रवाई",
            "text_en": (
                f"Biomass burning is the dominant contributor ({dom_share:.1f}% share, {fire_count} active fire detections upwind). "
                "Issue urgent coordination alert to upwind district administrations for stubble enforcement and field patrols."
            ),
            "text_hi": (
                f"बायोमास और पराली दहन प्रमुख प्रदूषण स्रोत है ({dom_share:.1f}% हिस्सेदारी, हवा के रुख पर {fire_count} आग बिंदु सक्रिय)। "
                "हवा के रुख वाले जिला प्रशासन को तत्काल पराली नियंत्रण और गश्त के लिए अलर्ट जारी करें।"
            ),
            "evidence": {
                "source": "fire",
                "share_pct": dom_share,
                "confidence": confidence_score,
                "upwind_fire_count": fire_count,
            },
        })

    # 2. Road & Construction Dust Rules
    if dominant_source == "dust":
        actions.append({
            "ward_id": ward_id,
            "city_id": city_id,
            "department": "Municipal Corporation (Nagar Nigam)",
            "category": "Dust Control",
            "priority": "High" if dom_share > 40 else "Medium",
            "title_en": "Intensive Water Sprinkling & Construction Cover Audits",
            "title_hi": "सड़कों पर पानी का छिड़काव और निर्माण स्थलों की जांच",
            "text_en": (
                f"Suspended dust accounts for {dom_share:.1f}% of localized pollution. "
                "Deploy anti-smog water mist cannons and mechanized road sweepers. Enforce mandatory green tarpaulin coverings at construction sites."
            ),
            "text_hi": (
                f"धूल कण स्थानीय प्रदूषण का {dom_share:.1f}% हिस्सा हैं। "
                "एंटी-स्मॉग वाटर कैनन और मैकेनाइज्ड रोड स्वीपर तैनात करें। निर्माण स्थलों पर हरी तिरपाल लगाना अनिवार्य करें।"
            ),
            "evidence": {
                "source": "dust",
                "share_pct": dom_share,
                "near_construction": evidence.get("dust", {}).get("near_construction", False),
            },
        })

    # 3. Vehicular Traffic Rules (especially with inversion trap)
    if dominant_source == "traffic":
        if is_trap:
            actions.append({
                "ward_id": ward_id,
                "city_id": city_id,
                "department": "Traffic Police & Transport Dept",
                "category": "Traffic Diversion",
                "priority": "Critical",
                "title_en": "Heavy Commercial Vehicle Diversion during Atmospheric Inversion",
                "title_hi": "प्रदूषण ट्रैप के दौरान भारी वाणिज्यिक वाहनों का मार्ग परिवर्तन",
                "text_en": (
                    f"Traffic emissions contribute {dom_share:.1f}% under severe atmospheric stagnation/trap conditions. "
                    "Enforce immediate bypass diversion for non-destined heavy diesel trucks and increase city electric bus frequency."
                ),
                "text_hi": (
                    f"मौसम के ठहराव (ट्रैप) के बीच यातायात से {dom_share:.1f}% प्रदूषण हो रहा है। "
                    "भारी डीजल ट्रकों को शहर के बाहर बाईपास पर डायवर्ट करें और इलेक्ट्रिक सिटी बसों की संख्या बढ़ाएं।"
                ),
                "evidence": {
                    "source": "traffic",
                    "share_pct": dom_share,
                    "is_trap": True,
                },
            })
        else:
            actions.append({
                "ward_id": ward_id,
                "city_id": city_id,
                "department": "Traffic Police",
                "category": "Traffic Flow Optimization",
                "priority": "Medium",
                "title_en": "Corridor Traffic Optimization and Signal Synchronization",
                "title_hi": "प्रमुख मार्गों पर ट्रैफिक सिग्नल सिंक्रोनाइज़ेशन",
                "text_en": (
                    f"Vehicular traffic is the leading source ({dom_share:.1f}%). "
                    "Synchronize arterial corridor traffic lights to reduce idling emissions at major intersections."
                ),
                "text_hi": (
                    f"वाहनों का धुआं मुख्य स्रोत है ({dom_share:.1f}%)। "
                    "प्रमुख चौराहों पर वाहनों के इंजन चालू रखकर खड़े रहने से रोकने के लिए सिग्नलों का तालमेल बनाएं।"
                ),
                "evidence": {"source": "traffic", "share_pct": dom_share},
            })

    # 4. Industrial Source Rules
    if dominant_source == "industry":
        actions.append({
            "ward_id": ward_id,
            "city_id": city_id,
            "department": "State Pollution Control Board (MPPCB)",
            "category": "Industrial Inspection",
            "priority": "High",
            "title_en": "Upwind Industrial Emission & Stack Monitoring Audit",
            "title_hi": "हवा के रुख पर स्थित औद्योगिक चिमनियों का निरीक्षण",
            "text_en": (
                f"Industrial emissions account for {dom_share:.1f}% of particulate load. "
                "Dispatch MPPCB flying squads to audit continuous emission monitoring systems (CEMS) in upwind industrial zones within 5km."
            ),
            "text_hi": (
                f"औद्योगिक उत्सर्जन का हिस्सा {dom_share:.1f}% है। "
                "मध्य प्रदेश प्रदूषण नियंत्रण बोर्ड (MPPCB) के उड़न दस्तों द्वारा 5 किमी के दायरे में स्थित फैक्ट्रियों के धुएं की जांच कराएं।"
            ),
            "evidence": {
                "source": "industry",
                "share_pct": dom_share,
                "upwind_industry_count": evidence.get("industry", {}).get("upwind_industry_count_5km", 0),
            },
        })

    # 5. Vulnerability & Sensitive Institution Protection
    if risk_category in ("High", "Critical"):
        actions.append({
            "ward_id": ward_id,
            "city_id": city_id,
            "department": "School Education & Health Dept",
            "category": "Vulnerable Population Protection",
            "priority": "High" if risk_category == "High" else "Critical",
            "title_en": "Health Advisory and School Activity Restrictions",
            "title_hi": "स्वास्थ्य सलाह और स्कूलों में बाहरी गतिविधियों पर रोक",
            "text_en": (
                f"Ward exposure risk is {risk_category}. "
                "Advise schools to suspend outdoor morning assemblies and sports. Ensure primary health centres maintain adequate stocks of bronchodilators."
            ),
            "text_hi": (
                f"वार्ड में जोखिम स्तर '{risk_category}' है। "
                "स्कूलों में सुबह की प्रार्थना और खेल जैसी बाहरी गतिविधियां स्थगित करने की सलाह दें। स्वास्थ्य केंद्रों में नेबुलाइज़र व दवाइयों का स्टॉक रखें।"
            ),
            "evidence": {
                "risk_category": risk_category,
                "vulnerability": evidence.get("vulnerability", {}),
            },
        })

    return actions
