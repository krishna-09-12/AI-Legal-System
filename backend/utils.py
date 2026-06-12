import re
import os
from datetime import datetime
from openai import OpenAI

def refine_category_by_keywords(text: str, predicted_category: str) -> str:
    """Refine or correct the ML model's predicted category based on key legal indicators."""
    text_lower = text.lower()
    
    # Keyword list per category
    fraud_keywords = ["fraud", "cheat", "scam", "lottery", "otp", "money stolen", "bank account", "bank call", "paise thag", "cheating", "cyber fraud", "scammed"]
    cyber_keywords = ["hack", "compromised", "phishing", "online abuse", "account hack", "instagram", "facebook", "social media", "email hack", "netbanking hack", "hacked"]
    theft_keywords = ["steal", "stolen", "snatch", "thief", "chori", "snatching", "missing bike", "missing phone", "stole"]
    assault_keywords = ["beat", "assault", "attack", "hit", "fight", "punch", "injury", "injured", "knife", "mara", "peeta", "ladai", "jhagda", "physical fight", "beating"]
    harassment_keywords = ["stalk", "harass", "abuse", "teasing", "abusive", "pareshan", "peecha", "threaten to post", "bad gesture", "stalking", "eve teasing"]
    missing_keywords = ["missing", "lost", "disappeared", "kidnap", "kidnapped", "not return", "not came home", "mil nahi", "gumshuda", "gum ho", "went missing"]

    # Match counts
    matches = {
        "Fraud": sum(1 for kw in fraud_keywords if kw in text_lower),
        "Cybercrime": sum(1 for kw in cyber_keywords if kw in text_lower),
        "Theft": sum(1 for kw in theft_keywords if kw in text_lower),
        "Assault": sum(1 for kw in assault_keywords if kw in text_lower),
        "Harassment": sum(1 for kw in harassment_keywords if kw in text_lower),
        "Missing Person": sum(1 for kw in missing_keywords if kw in text_lower)
    }
    
    # Get category with highest matches
    best_keyword_category = max(matches, key=matches.get)
    
    # If the highest keyword match count is >= 1, we use it to override/refine, otherwise keep predicted
    if matches[best_keyword_category] >= 1:
        return best_keyword_category
        
    return predicted_category

def get_dynamic_ipc_and_remedies(text: str, category: str) -> dict:
    """Dynamically assign specific IPC or IT Act sections and remedies based on incident sub-elements."""
    text_lower = text.lower()
    
    if category == "Theft":
        # Check sub-types of theft
        if any(w in text_lower for w in ["house", "home", "ghar", "room", "apartment", "residence", "flat"]):
            return {
                "ipc": "Section 380 of the Indian Penal Code (IPC) - Theft in dwelling house (Severe, up to 7 years imprisonment)",
                "severity": "Medium-High",
                "severity_reason": "Theft occurring inside a residential premises, violating home sanctity and security.",
                "remedies": [
                    "Identify all missing valuables (jewelry, cash, documents, electronics).",
                    "Avoid touching cupboards, locks, or surface points to preserve fingerprint evidence for forensics.",
                    "Check neighborhood CCTV recordings and secure footage of suspicious entries/exits.",
                    "File an FIR at the local police station under Section 380."
                ]
            }
        elif any(w in text_lower for w in ["snatch", "chain", "purse", "bhaag", "snatched"]):
            return {
                "ipc": "Section 379A of the Indian Penal Code (IPC) - Snatching (Severe, up to 10 years imprisonment)",
                "severity": "High",
                "severity_reason": "Forceful snatching of property from a person's possession, posing immediate physical safety risk.",
                "remedies": [
                    "Note down the physical appearance of the snatcher and their direction of escape.",
                    "Check if any vehicle number or make was noted, or captured on traffic/shop cameras.",
                    "Contact the local police immediately (dial 112) to flash a wireless alert to patrol units.",
                    "File an FIR under Section 379A at the nearest police station."
                ]
            }
        else:
            return {
                "ipc": "Section 379 of the Indian Penal Code (IPC) - Simple Theft (Up to 3 years imprisonment)",
                "severity": "Medium",
                "severity_reason": "Theft of movable property without house trespass or force.",
                "remedies": [
                    "Block any stolen debit/credit cards, SIM cards, or identity proofs immediately.",
                    "Gather purchase bills, serial numbers, and IMEI details of the stolen items.",
                    "Report the theft to the local police station to obtain a certified copy of the FIR."
                ]
            }
            
    elif category == "Assault":
        if any(w in text_lower for w in ["weapon", "knife", "chaku", "stick", "rod", "danda", "gun", "pistol", "bottle"]):
            return {
                "ipc": "Section 324 / 326 of the Indian Penal Code (IPC) - Voluntarily causing hurt by dangerous weapons (Severe, up to 10 years or life imprisonment)",
                "severity": "High",
                "severity_reason": "Assault involving deadly or dangerous weapons, creating high danger to life.",
                "remedies": [
                    "Seek emergency medical treatment immediately and request a Medico-Legal Certificate (MLC).",
                    "Inform the medical officer that it is an assault case involving a weapon; the hospital will notify the police.",
                    "Photograph the weapon (if left at scene) and all wounds/injuries.",
                    "File an FIR under IPC Section 324/326 immediately."
                ]
            }
        elif any(w in text_lower for w in ["threat", "kill", "dhamki", "marn", "threatened"]):
            return {
                "ipc": "Section 323 / 506 of the Indian Penal Code (IPC) - Voluntarily causing hurt & Criminal Intimidation",
                "severity": "High",
                "severity_reason": "Physical attack accompanied by serious verbal threats to life or limb.",
                "remedies": [
                    "Secure a Medico-Legal Certificate (MLC) from a government hospital.",
                    "Save any voice recordings, messages, or video evidence of the threat.",
                    "File a detailed complaint including the specific threatening words used by the accused.",
                    "Apply for police protection if there is an active threat to life."
                ]
            }
        else:
            return {
                "ipc": "Section 323 / 351 of the Indian Penal Code (IPC) - Voluntarily causing hurt & Assault",
                "severity": "Medium-High",
                "severity_reason": "Physical violence causing bodily pain or harm without weapon.",
                "remedies": [
                    "Get a medical checkup and obtain the MLC.",
                    "Gather contacts of any witnesses who saw the fight.",
                    "Visit the nearest police station to lodge an FIR."
                ]
            }

    elif category == "Fraud":
        if any(w in text_lower for w in ["document", "paper", "property", "sign", "forg", "registry", "fake document"]):
            return {
                "ipc": "Section 420 / 467 / 468 of the Indian Penal Code (IPC) - Cheating & Forgery of valuable security",
                "severity": "High",
                "severity_reason": "Forgery of valuable financial documents or property deeds to commit cheating.",
                "remedies": [
                    "Retrieve official property deeds, registry records, or original documents.",
                    "Consult a document examiner or handwriting forensic specialist if signatures are forged.",
                    "File a complaint with the Sub-Registrar and local police under Sections 420, 467, 468.",
                    "File a civil injunction suit to prevent unauthorized sale of the property."
                ]
            }
        elif any(w in text_lower for w in ["online", "scam", "upi", "card", "otp", "phishing", "scammed"]):
            return {
                "ipc": "Section 420 of the IPC & Section 66D of the IT Act - Cheating by personation using computer resource",
                "severity": "Medium-High",
                "severity_reason": "Online financial fraud targeting bank accounts or digital transactions.",
                "remedies": [
                    "Report immediately to the National Cyber Fraud Helpline at 1930.",
                    "Block the bank account, UPI ID, and cards associated with the transaction.",
                    "File an official online portal complaint at cybercrime.gov.in.",
                    "Collect bank statements and transaction reference IDs."
                ]
            }
        else:
            return {
                "ipc": "Section 420 of the Indian Penal Code (IPC) - Cheating and dishonestly inducing delivery of property",
                "severity": "Medium",
                "severity_reason": "General cheating or breach of financial trust.",
                "remedies": [
                    "Preserve all transaction receipts, email communications, and chats with the fraudulent entity.",
                    "Send a legal notice demanding refund of the cheated money.",
                    "File a complaint under IPC Section 420 at the local police station."
                ]
            }

    elif category == "Harassment":
        if any(w in text_lower for w in ["online", "whatsapp", "instagram", "photo", "video", "message", "facebook", "stalk"]):
            return {
                "ipc": "Section 354D of the IPC & Section 67 / 67A of the IT Act - Online Stalking & Publishing obscene material",
                "severity": "High",
                "severity_reason": "Digital stalking, abuse, and harassment targeting modesty online.",
                "remedies": [
                    "Take clear screenshots of all abusive profiles, posts, chats, and comments. Do not delete them.",
                    "Report the account/post to the platform's safety team for removal.",
                    "File an online complaint on the Cyber Crime Portal under the 'Women/Child Related Crime' section.",
                    "Seek support from Cyber Nodal officers or Women helpline numbers (1091)."
                ]
            }
        else:
            return {
                "ipc": "Section 354A / 509 of the Indian Penal Code (IPC) - Sexual harassment & Insulting modesty of a woman",
                "severity": "High",
                "severity_reason": "Physical/verbal harassment, eve teasing, or offensive gestures in public or workplace.",
                "remedies": [
                    "Lodge a complaint with the Internal Complaints Committee (ICC) if it occurred at the workplace.",
                    "Contact the National Commission for Women (NCW) helpline at 7827170170.",
                    "Report the incident to the local police station to file an FIR."
                ]
            }

    elif category == "Cybercrime":
        if any(w in text_lower for w in ["hack", "access", "password", "website", "server", "hacked"]):
            return {
                "ipc": "Section 43 / 66 of the Information Technology (IT) Act - Hacking & Unauthorized computer access",
                "severity": "Medium-High",
                "severity_reason": "Unauthorized breach of computer systems, profiles, or network resources.",
                "remedies": [
                    "Change passwords of all accounts using a clean device, and setup Multi-Factor Authentication (MFA).",
                    "Isolate the infected system from the local network to prevent malware spread.",
                    "Collect firewall logs, audit trails, and unauthorized login timestamps.",
                    "File an official complaint at cybercrime.gov.in."
                ]
            }
        else:
            return {
                "ipc": "Section 66D of the Information Technology (IT) Act - Cheating by personation using computer resource",
                "severity": "Medium",
                "severity_reason": "General cyber fraud, phishing, or identity impersonation online.",
                "remedies": [
                    "Report the phishing link or domain to Google Safebrowsing and domain registrar.",
                    "Save screenshots of the fraudulent website, headers of fake emails, and text messages.",
                    "File an online petition at cybercrime.gov.in."
                ]
            }

    elif category == "Missing Person":
        if any(w in text_lower for w in ["minor", "child", "kid", "son", "daughter", "years old", "bachha", "beta", "beti"]):
            return {
                "ipc": "Section 363 of the Indian Penal Code (IPC) - Kidnapping (Severe, up to 7 years imprisonment)",
                "severity": "High",
                "severity_reason": "Missing minor child, legally treated as suspected kidnapping by default.",
                "remedies": [
                    "File an FIR for Kidnapping (IPC 363) immediately. By Supreme Court mandate, an FIR must be registered for missing minors.",
                    "Provide a recent photograph, details of height, visible birthmarks, and clothing details to the police.",
                    "Activate local child protection networks and dial 1098 (Childline Helpline).",
                    "Publish alerts in local newspapers and broadcast via community messaging channels."
                ]
            }
        else:
            return {
                "ipc": "General Missing Report / Habeas Corpus Directive",
                "severity": "High",
                "severity_reason": "Missing adult where safety or wellness is highly threatened.",
                "remedies": [
                    "Visit the nearest police station immediately to file a Missing Person Report (MPR).",
                    "Verify last known location by checking active cell tower logs or bank card usage (police assisted).",
                    "Check with surrounding transit terminals, railways, and hospitals.",
                    "Request police to flash wireless alerts to border checks and PCR vans."
                ]
            }

    # Fallback to standard
    return {
        "ipc": "General sections",
        "severity": "Medium",
        "severity_reason": "Investigation needed.",
        "remedies": ["Visit the local police station to file a complaint."]
    }

def extract_entities_regex(text: str) -> dict:
    """Extract location, date/time, victim, and suspect details using simple rules."""
    text_lower = text.lower()
    
    # 1. Location extraction
    location_match = re.search(
        r"(?:at|in|near|from|inside)\s+([a-zA-Z\s]{3,20})(?:station|market|bus|metro|home|house|park|road|office|shop|college|school)?",
        text, re.IGNORECASE
    )
    location = location_match.group(0).strip() if location_match else "Not specified (Inquiry required)"
    
    # Simple common overrides
    if "home" in text_lower or "house" in text_lower or "ghar" in text_lower:
        location = "Residence / Home"
    elif "metro" in text_lower:
        location = "Metro Station / Train"
    elif "bus" in text_lower:
        location = "Public Bus / Stop"
    elif "parking" in text_lower:
        location = "Parking Space"
    elif "market" in text_lower or "road" in text_lower or "street" in text_lower:
        location = "Public Road / Market"
        
    # 2. Date/Time extraction
    date_time = "Recent (Inquiry required)"
    if "yesterday" in text_lower or "kal" in text_lower:
        date_time = "Yesterday"
    elif "today" in text_lower or "aaj" in text_lower:
        date_time = "Today"
    elif "morning" in text_lower or "subah" in text_lower:
        date_time = "Morning hours"
    elif "night" in text_lower or "raat" in text_lower:
        date_time = "Night hours"
    
    # 3. Suspect extraction
    suspect = "Unknown / Under investigation"
    if "neighbor" in text_lower or "padosi" in text_lower:
        suspect = "Neighbor"
    elif "manager" in text_lower or "boss" in text_lower:
        suspect = "Work Manager/Colleague"
    elif "friend" in text_lower or "dost" in text_lower:
        suspect = "Known acquaintance"
    elif "thief" in text_lower or "chor" in text_lower:
        suspect = "Unidentified Thief"
    
    # 4. Victim extraction
    victim = "Self / Complainant"
    if "my son" in text_lower or "mera beta" in text_lower or "meri beti" in text_lower or "my daughter" in text_lower:
        victim = "Complainant's Child"
    elif "my brother" in text_lower or "mera bhai" in text_lower:
        victim = "Complainant's Brother"
    elif "my sister" in text_lower or "meri behen" in text_lower:
        victim = "Complainant's Sister"
    elif "my mother" in text_lower or "meri maa" in text_lower:
        victim = "Complainant's Mother"
    elif "my father" in text_lower or "mere papa" in text_lower:
        victim = "Complainant's Father"
    elif "my grandmother" in text_lower or "dadi" in text_lower or "nani" in text_lower:
        victim = "Complainant's Grandmother"

    return {
        "incident_location": location,
        "incident_time": date_time,
        "suspect_details": suspect,
        "victim_details": victim
    }

def generate_report(text: str, category: str, api_key: str = None) -> dict:
    """Generate structured legal report, using GPT if API key is provided, else fallback to templates."""
    
    # Refine classification via hybrid keyword heuristics first
    refined_category = refine_category_by_keywords(text, category)
    
    # If API key is available, use GPT-4o-mini for premium generation
    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""
You are an expert AI Legal Assistant specialized in Indian Criminal Law. 
We have received a complaint with the following details:
Category: {refined_category}
Incident Description: "{text}"

Generate a structured, professional FIR-like report. Please return a JSON object with the following schema:
{{
  "complaint_id": "Generate a unique reference like AEG-2026-XXXX",
  "incident_time": "Extract approximate incident time or date",
  "incident_location": "Extract location",
  "victim_details": "Extract victim details",
  "suspect_details": "Extract suspect details",
  "report_summary": "A formal, structured description of the incident in clear language",
  "ipc_sections": "Relevant IPC or IT Act sections applicable to this specific complaint",
  "severity_level": "Low, Medium, or High",
  "severity_reason": "Brief explanation of the severity rating",
  "suggested_actions": [
     "List 3-4 highly specific, actionable legal remedies or steps the user must take next"
  ]
}}

Format requirements:
- Return ONLY valid JSON, no markdown wrappers, no backticks.
- Support both English and Hindi/Hinglish contexts where appropriate, but keep the structure in English.
- Ensure suggested actions are actionable and clear.
"""
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful legal assistant returning structured JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            import json
            report_data = json.loads(response.choices[0].message.content)
            return report_data
            
        except Exception as e:
            print(f"⚠️ GPT generation failed (falling back to rule-based): {e}")

    # Fallback Rule-Based Generation
    entities = extract_entities_regex(text)
    
    # Fetch dynamic IPC sections and remedies
    dynamic_legal_info = get_dynamic_ipc_and_remedies(text, refined_category)
    
    # Generate unique ID
    import random
    ref_num = random.randint(1000, 9999)
    complaint_id = f"AEG-2026-{ref_num}"
    
    return {
        "complaint_id": complaint_id,
        "incident_time": entities["incident_time"],
        "incident_location": entities["incident_location"],
        "victim_details": entities["victim_details"],
        "suspect_details": entities["suspect_details"],
        "report_summary": f"Complaint filed regarding {refined_category.lower()}. Details: {text}",
        "ipc_sections": dynamic_legal_info["ipc"],
        "severity_level": dynamic_legal_info["severity"],
        "severity_reason": dynamic_legal_info["severity_reason"],
        "suggested_actions": dynamic_legal_info["remedies"]
    }
