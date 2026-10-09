import os
import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

tm_path = 'src/components/TeacherMode.tsx'
tm = read_file(tm_path)

# Find the block {(() => { ... })()}
# Actually, I can just use a regex that matches from `          {(() => {` to `          })()}`
pattern = re.compile(r'\{\(\(\) => \{.*?\}\)\(\)\}', re.DOTALL)

replacement = '''{(() => {
            const src = getToolEmbedUrl(activeTool);
            return (
              <iframe
                src={src}
                width="100%"
                height="100%"
                style={{ border: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                allowFullScreen
                title={activeTool.name}
              />
            );
          })()}'''

tm = pattern.sub(replacement, tm)
write_file(tm_path, tm)
