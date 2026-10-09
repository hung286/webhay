import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

path = 'src/utils/storage.ts'
content = read_file(path)

# Bump version to ensure defaults are reloaded!
content = content.replace("'edu_teaching_tools_v32'", "'edu_teaching_tools_v33'")

# Replace the Geogebra URL with our custom HTML
content = content.replace("'https://www.geogebra.org/3d'", "'/phuong-trinh-mat-cau.html'")

# We already updated type to 'iframe' in a previous step, but let's make sure
content = content.replace("type: 'geogebra',\n    category: 'thao-tac',\n    url: '/phuong-trinh-mat-cau.html'", "type: 'iframe',\n    category: 'thao-tac',\n    url: '/phuong-trinh-mat-cau.html'")

write_file(path, content)
print("Updated storage to include custom HTML tool")
