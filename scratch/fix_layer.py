import re

def fix_layer():
    with open('frontend/lib/services/http/HttpAuditRepository.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('layer: "ORCHESTRATION",', 'layer: "ORCHESTRATION" as any,')
    
    with open('frontend/lib/services/http/HttpAuditRepository.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_layer()
