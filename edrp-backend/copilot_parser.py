import io
import base64
import json
from typing import List, Dict, Any, Optional
import pandas as pd
from PIL import Image

try:
    import pypdf
except ImportError:
    pypdf = None


def decode_file_bytes(base64_str: str) -> bytes:
    """Strip data URL scheme if present and decode base64 string to bytes."""
    if not base64_str:
        return b""
    if "," in base64_str and base64_str.startswith("data:"):
        base64_str = base64_str.split(",", 1)[1]
    return base64.b64decode(base64_str)


def df_to_markdown_safe(df: pd.DataFrame) -> str:
    """Safely convert DataFrame to markdown table with native fallback."""
    try:
        return df.to_markdown(index=False)
    except Exception:
        # Native markdown table generator
        if df.empty:
            return "[Empty Table]"
        cols = [str(c) for c in df.columns]
        header = "| " + " | ".join(cols) + " |"
        sep = "| " + " | ".join(["---"] * len(cols)) + " |"
        rows = []
        for _, row in df.iterrows():
            row_str = "| " + " | ".join([str(val).replace("\n", " ").strip() for val in row.values]) + " |"
            rows.append(row_str)
        return "\n".join([header, sep] + rows)


def parse_spreadsheet(file_bytes: bytes, filename: str) -> str:
    """Extract sheet contents, headers, preview rows, and summary stats from Excel or CSV."""
    is_csv = filename.lower().endswith(".csv")
    output_lines = []

    try:
        if is_csv:
            df = pd.read_csv(io.BytesIO(file_bytes))
            sheets = {"Sheet1": df}
        else:
            sheets = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)

        for sheet_name, df in sheets.items():
            output_lines.append(f"### Sheet: {sheet_name} (Rows: {len(df)}, Columns: {len(df.columns)})")
            output_lines.append(f"Columns: {', '.join([str(c) for c in df.columns.tolist()])}")
            
            # Format top 15 preview rows as markdown table
            preview_df = df.head(15).fillna("")
            if not preview_df.empty:
                output_lines.append("\nPreview Data (First 15 Rows):")
                output_lines.append(df_to_markdown_safe(preview_df))
            
            # Numeric summaries if available
            numeric_cols = df.select_dtypes(include=["number"]).columns
            if len(numeric_cols) > 0:
                stats = df[numeric_cols].describe().round(2).fillna("")
                output_lines.append("\nSummary Statistics for Numeric Columns:")
                output_lines.append(df_to_markdown_safe(stats.reset_index()))
            output_lines.append("\n" + "-" * 40)

        return "\n".join(output_lines)
    except Exception as e:
        return f"Error reading spreadsheet '{filename}': {str(e)}"


def parse_pdf(file_bytes: bytes, filename: str, max_chars: int = 15000) -> str:
    """Extract page text from PDF files using pypdf."""
    if not pypdf:
        return f"PDF parser library not installed. Uploaded PDF '{filename}' ({len(file_bytes)} bytes)."

    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        total_pages = len(reader.pages)
        output_lines = [f"PDF Document: {filename} (Total Pages: {total_pages})"]

        accumulated_text = ""
        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            text = page.extract_text() or ""
            text = text.strip()
            if text:
                chunk = f"\n--- Page {page_num} ---\n{text}\n"
                if len(accumulated_text) + len(chunk) > max_chars:
                    remaining = max_chars - len(accumulated_text)
                    accumulated_text += chunk[:remaining] + "\n\n[... Remaining pages truncated for brevity ...]"
                    break
                accumulated_text += chunk

        output_lines.append(accumulated_text if accumulated_text.strip() else "[No extractable text found in PDF]")
        return "\n".join(output_lines)
    except Exception as e:
        return f"Error reading PDF '{filename}': {str(e)}"


def parse_image(file_bytes: bytes, filename: str) -> str:
    """Inspect image dimensions, format, and metadata."""
    try:
        img = Image.open(io.BytesIO(file_bytes))
        width, height = img.size
        img_format = img.format or "Unknown"
        mode = img.mode
        size_kb = round(len(file_bytes) / 1024, 1)

        return (
            f"Image File Attached: '{filename}'\n"
            f"- Format: {img_format}\n"
            f"- Resolution: {width} x {height} pixels\n"
            f"- Color Mode: {mode}\n"
            f"- File Size: {size_kb} KB\n"
            f"Note: User attached this image to their question. Help them with context about decision evidence, diagrams, or UI flow."
        )
    except Exception as e:
        return f"Attached image '{filename}' ({round(len(file_bytes)/1024, 1)} KB): {str(e)}"


def parse_text_or_code(file_bytes: bytes, filename: str, max_chars: int = 15000) -> str:
    """Decode raw text, JSON, or code files."""
    try:
        text = file_bytes.decode("utf-8", errors="replace")
        if len(text) > max_chars:
            text = text[:max_chars] + "\n\n[... File content truncated for length ...]"
        return f"File: {filename}\n```\n{text}\n```"
    except Exception as e:
        return f"Error reading text file '{filename}': {str(e)}"


def process_attached_files(files: Optional[List[Dict[str, Any]]]) -> str:
    """Process an array of uploaded files and format them for inclusion in the AI context prompt."""
    if not files or len(files) == 0:
        return ""

    parsed_sections = []

    for file_info in files:
        filename = file_info.get("name", "attached_file")
        mime_type = file_info.get("type", "")
        base64_data = file_info.get("data", "")

        if not base64_data:
            continue

        try:
            file_bytes = decode_file_bytes(base64_data)
            fn_lower = filename.lower()

            if fn_lower.endswith((".xlsx", ".xls", ".csv")) or "spreadsheet" in mime_type or "excel" in mime_type or "csv" in mime_type:
                parsed_content = parse_spreadsheet(file_bytes, filename)
            elif fn_lower.endswith(".pdf") or "pdf" in mime_type:
                parsed_content = parse_pdf(file_bytes, filename)
            elif fn_lower.endswith((".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".bmp")) or mime_type.startswith("image/"):
                parsed_content = parse_image(file_bytes, filename)
            else:
                parsed_content = parse_text_or_code(file_bytes, filename)

            section = (
                f"================================================\n"
                f"ATTACHED USER FILE: {filename}\n"
                f"================================================\n"
                f"{parsed_content}\n"
                f"================================================\n"
            )
            parsed_sections.append(section)
        except Exception as err:
            parsed_sections.append(f"Failed to process attached file '{filename}': {str(err)}")

    if not parsed_sections:
        return ""

    return (
        "\n\nUSER UPLOADED ATTACHMENTS & EXTRACTED DATA:\n"
        "Analyze the following uploaded file data thoroughly to answer the user's inquiry:\n\n"
        + "\n".join(parsed_sections)
    )
