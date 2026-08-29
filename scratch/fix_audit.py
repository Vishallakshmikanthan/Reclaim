import re

def fix_audit():
    with open('frontend/lib/services/http/HttpAuditRepository.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('getEventsByCase(', 'getCaseEvents(')
    content = content.replace('logEvent(', 'addEvent(')
    with open('frontend/lib/services/http/HttpAuditRepository.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_audit()
