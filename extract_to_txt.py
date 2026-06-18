import pypdf

def extract_pdf_text(pdf_path, txt_path):
    print(f"Extracting {pdf_path} to {txt_path}...")
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")
    
    with open(txt_path, "w", encoding="utf-8") as f:
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            f.write(f"--- PAGE {idx+1} ---\n")
            f.write(text)
            f.write("\n")
    print("Done!")

if __name__ == "__main__":
    extract_pdf_text("Gemini Chat Logs.pdf", "gemini_chat_logs.txt")
