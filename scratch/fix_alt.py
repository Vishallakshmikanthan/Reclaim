import re

def fix_alt():
    with open('frontend/app/cases/[id]/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('alternatives.map((alt, i)', 'alternatives.map((alt: any, i: number)')
    with open('frontend/app/cases/[id]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_alt()
