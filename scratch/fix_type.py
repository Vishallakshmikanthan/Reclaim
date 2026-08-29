import re

def fix_type_error():
    with open('frontend/app/cases/[id]/page.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('positive.map((pos, i)', 'positive.map((pos: any, i: number)')
    content = content.replace('negative.map((neg, i)', 'negative.map((neg: any, i: number)')
    
    with open('frontend/app/cases/[id]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_type_error()
