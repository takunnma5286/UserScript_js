import os
import urllib.parse
import re

def convert_to_bookmarklet(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.endswith(".user.js"):
            input_path = os.path.join(input_dir, filename)
            
            with open(input_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Remove UserScript Metadata Block
            content = re.sub(r"// ==UserScript==[\s\S]*?// ==/UserScript==\s*", "", content)

            # Remove single line comments (simple heuristic, careful with strings)
            # This regex matches // comment until end of line but avoids http://
            # However, simpler approach for now: just strip the metadata block which is the main non-JS part.
            # Multiline comments /* ... */ are valid in JS but waste space.
            
            # Simple minification: remove comments and extra whitespace
            # Note: This is a basic text processor. For complex JS, a proper minifier is recommended.
            lines = content.splitlines()
            cleaned_lines = []
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                if line.startswith("//"):
                    continue
                cleaned_lines.append(line)
            
            code = "\n".join(cleaned_lines)
            
            # Wrap in IIFE
            bookmarklet_code = f"(function(){{ {code} }})();"
            
            # URL Encode
            encoded_code = urllib.parse.quote(bookmarklet_code)
            
            # Final Bookmarklet String
            final_bookmarklet = f"javascript:{encoded_code}"
            
            # Output filename
            output_filename = filename.replace(".user.js", ".bookmarklet.txt")
            output_path = os.path.join(output_dir, output_filename)
            
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(final_bookmarklet)
            
            print(f"Converted: {filename} -> {output_filename}")

if __name__ == "__main__":
    convert_to_bookmarklet("UserScripts", "Bookmarklets")
