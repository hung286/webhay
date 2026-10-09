import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

path = 'src/utils/storage.ts'
content = read_file(path)

# bump version
content = content.replace("'edu_teaching_tools_v31'", "'edu_teaching_tools_v32'")

# insert new tool
new_tool = '''  {
    id: 'tool_default_geogebra_2',
    name: 'Giải toán phương trình mặt cầu',
    type: 'geogebra',
    category: 'thao-tac',
    url: 'https://www.geogebra.org/3d',
    description: 'Trợ lý mô phỏng hình học không gian 3D, giải toán phương trình mặt cầu',
    isActive: true,
    createdAt: new Date().toISOString()
  },
'''

# Find the start of DEFAULT_TOOLS array and insert the new tool
pattern = re.compile(r'export const DEFAULT_TOOLS: TeachingTool\[\] = \[\s*')
content = pattern.sub('export const DEFAULT_TOOLS: TeachingTool[] = [\n' + new_tool, content)

write_file(path, content)
print("Added tool successfully")
