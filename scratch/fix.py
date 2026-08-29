import re

def fix():
    with open('frontend/lib/services/http/HttpAuditRepository.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('getEvents()', 'getAllEvents()')
    with open('frontend/lib/services/http/HttpAuditRepository.ts', 'w', encoding='utf-8') as f:
        f.write(content)

    with open('frontend/lib/context/ReclaimContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('services.auditRepo.getEvents()', 'services.auditRepo.getAllEvents()')
    with open('frontend/lib/context/ReclaimContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix()
