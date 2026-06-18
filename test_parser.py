import re
import json

def clean_text(text):
    # Remove form feeds
    text = text.replace("\x0c", "").replace("\f", "")
    
    # Remove header line "Scraper Conversations" and page numbers
    lines = text.split("\n")
    cleaned_lines = []
    for line in lines:
        l_strip = line.strip()
        if l_strip.lower() == "scraper conversations":
            continue
        if l_strip.isdigit():
            continue
        cleaned_lines.append(line)
        
    return "\n".join(cleaned_lines)

def parse_conversations(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    cleaned_content = clean_text(content)
    
    # Split by "you asked"
    matches = list(re.finditer(r"you asked", cleaned_content))
    
    interactions = []
    for idx, match in enumerate(matches):
        start = match.end()
        end = matches[idx+1].start() if idx + 1 < len(matches) else len(cleaned_content)
        
        block = cleaned_content[start:end].strip()
        
        # Parse timestamp
        time_match = re.search(r"message time:\s*([^\n]+)", block)
        timestamp = time_match.group(1).strip() if time_match else "Unknown Date"
        
        # Split prompt and response
        resp_split = block.split("gemini response")
        if len(resp_split) < 2:
            continue
            
        prompt = resp_split[0]
        if time_match:
            prompt = prompt.replace(time_match.group(0), "")
        prompt = prompt.strip()
        
        response_full = resp_split[1].strip()
        
        # Split lines to extract code block
        lines = response_full.split("\n")
        
        opening_lines = []
        code_lines = []
        closing_lines = []
        
        state = "opening" # "opening", "code", "closing"
        
        # Trigger words that indicate the code block is ending and natural text is starting
        closing_triggers = [
            "how can i", "would you like", "next steps", "explanation:", 
            "here's how", "here is how", "key points", "note:", 
            "this script", "to run this", "make sure to", "you will need",
            "let me know", "feel free to", "if you want", "in the next step"
        ]
        
        for line in lines:
            line_strip = line.strip()
            
            if state == "opening":
                is_code_start = (
                    line_strip.startswith("import ") or 
                    line_strip.startswith("from ") or 
                    line_strip.startswith("def ") or 
                    line_strip.startswith("class ") or
                    line_strip.startswith("headers =") or
                    line_strip.startswith("BASE_URL =") or
                    (line_strip.startswith("#") and ("python" in line_strip.lower() or "script" in line_strip.lower() or "code" in line_strip.lower()))
                )
                if is_code_start:
                    state = "code"
                    code_lines.append(line)
                else:
                    opening_lines.append(line)
            
            elif state == "code":
                # Check if this line looks like it belongs to closing text
                is_closing_trigger = any(line_strip.lower().startswith(trigger) for trigger in closing_triggers)
                
                # Check if it starts with a capital letter followed by standard text, but isn't code
                # e.g., "This will download..."
                # But wait, comments start with #. Python code might have variables like OUT_DIR = ...
                # Let's check if the line starts with a letter and has no operators like =, (, ), ., [, ]
                is_text_only = (
                    len(line_strip) > 0 and 
                    line_strip[0].isupper() and 
                    not any(op in line_strip for op in ["=", "(", ")", "[", "]", "import ", "def "]) and 
                    not line_strip.endswith(":") and
                    not line_strip.startswith("#")
                )
                
                if is_closing_trigger or is_text_only:
                    state = "closing"
                    closing_lines.append(line)
                else:
                    code_lines.append(line)
                    
            elif state == "closing":
                closing_lines.append(line)
                
        opening_remarks = "\n".join(opening_lines).strip()
        code_block = "\n".join(code_lines).strip()
        closing_remarks = "\n".join(closing_lines).strip()
        
        interactions.append({
            "index": idx + 1,
            "timestamp": timestamp,
            "prompt": prompt,
            "opening_remarks": opening_remarks,
            "code_block": code_block,
            "closing_remarks": closing_remarks
        })
        
    return interactions

interactions = parse_conversations("scraper_convs.txt")
print(f"Parsed {len(interactions)} interactions.")
for idx, inter in enumerate(interactions):
    print(f"\n[{inter['index']}] Time: {inter['timestamp']}")
    print(f"  Prompt (first 50 chars): {inter['prompt'][:50].replace(chr(10), ' ')}...")
    print(f"  Opening (first 50 chars): {inter['opening_remarks'][:50].replace(chr(10), ' ')}...")
    print(f"  Code Size: {len(inter['code_block'])} chars")
    print(f"  Closing (first 50 chars): {inter['closing_remarks'][:50].replace(chr(10), ' ')}...")
