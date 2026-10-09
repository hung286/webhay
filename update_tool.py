import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

path = 'src/utils/storage.ts'
content = read_file(path)

# Change 'geogebra' to 'iframe' for the 3D tool
content = content.replace(
    "name: 'Giải toán phương trình mặt cầu',\n    type: 'geogebra',",
    "name: 'Giải toán phương trình mặt cầu',\n    type: 'iframe',"
)

write_file(path, content)
print("Updated tool type successfully")
