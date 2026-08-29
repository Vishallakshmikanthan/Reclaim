import re

def fix_recovered():
    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('step: "recovered"', 'step: "success"')
    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_recovered()
