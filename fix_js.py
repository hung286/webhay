import re

path = r'C:\Users\Admin\Desktop\newapp\public\khao_sat_ham_so_12.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(r'\`', '`')
content = content.replace(r'\${', '${')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
